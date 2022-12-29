import { type Request, type Response } from "@google-cloud/functions-framework";

import { type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { handleCors } from "../service/cors.js";

export async function authenticateWithToken(
  app: App,
  req: Request,
  res: Response
) {
  if (!handleCors(req, res)) return;

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Validate query
  if (typeof req.query.token !== "string") {
    res.status(400).send("Invalid token");
    return;
  }
  if (typeof req.query.uid !== "string") {
    res.status(400).send("Invalid uid");
    return;
  }
  const { token, uid } = req.query;

  // Verify token
  const docRef = await db.collection("users").doc(uid).get();
  const data = docRef.data();
  if (!data) throw new Error("Record could not be fetched");
  const expectedToken = data.token;
  if (!expectedToken) throw new Error("token not found");
  if (token !== expectedToken) {
    res.status(401).send({});
    return;
  }

  // Generate custom token
  const customToken = await auth.createCustomToken(uid);
  res.send(customToken);
}

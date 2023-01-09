import { type Request, type Response } from "@google-cloud/functions-framework";
import { corsGet, corsSet } from "./testHelper";
import { describe, expect, it, vitest } from "vitest";

import { type App } from "firebase-admin/app";
import { type Auth } from "firebase-admin/auth";
import { type Firestore } from "firebase-admin/firestore";
import { authenticateWithToken } from "./authenticateWithToken";
import crypto from "crypto";


const app = {} as App;

describe("authenticateWithToken", () => {
  it("creates a custom token", async () => {
    const customToken = "customToken";
    const token = crypto.randomUUID();
    const uid = "uid";

    const req = {
      get: corsGet,
      query: {
        token,
        uid,
      },
    } as unknown as Request;

    const send = vitest.fn();
    const res = {
      send,
      set: corsSet,
    } as unknown as Response;

    const createCustomToken = vitest.fn().mockResolvedValue(customToken);
    const auth = { createCustomToken } as unknown as Auth;

    const data = () => ({ token });
    const get = () => ({ data });
    const doc = vitest.fn().mockReturnValue({ get });
    const collection = vitest.fn().mockReturnValue({ doc });
    const db = { collection } as unknown as Firestore;

    await authenticateWithToken(app, req, res, auth, db);
    expect(collection.mock.calls[0][0]).toBe("users");
    expect(doc.mock.calls[0][0]).toBe(uid);
    expect(createCustomToken.mock.calls[0][0]).toBe(uid);
    expect(send.mock.calls[0][0]).toBe(customToken);
  });

  it("rejects an invalid token", async () => {
    const customToken = "customToken";
    const token = crypto.randomUUID();
    const invalidToken = "invalidToken";
    const uid = "uid";

    const req = {
      get: corsGet,
      query: {
        token: invalidToken,
        uid,
      },
    } as unknown as Request;

    const send = vitest.fn();
    const status = vitest.fn().mockReturnValue({ send });
    const res = {
      set: corsSet,
      status,
    } as unknown as Response;

    const createCustomToken = vitest.fn().mockResolvedValue(customToken);
    const auth = { createCustomToken } as unknown as Auth;

    const data = () => ({ token });
    const get = () => ({ data });
    const doc = vitest.fn().mockReturnValue({ get });
    const collection = vitest.fn().mockReturnValue({ doc });
    const db = { collection } as unknown as Firestore;

    await authenticateWithToken(app, req, res, auth, db);
    expect(collection.mock.calls[0][0]).toBe("users");
    expect(doc.mock.calls[0][0]).toBe(uid);
    expect(createCustomToken.mock.calls.length).toBe(0);
    expect(status.mock.calls[0][0]).toBe(401);
    expect(send.mock.calls[0][0]).toEqual({});
  });
});

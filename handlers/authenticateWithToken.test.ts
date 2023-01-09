import { type Request, type Response } from "@google-cloud/functions-framework";
import { describe, expect, it, vi } from "vitest";

import { type App } from "firebase-admin/app";
import { type Auth } from "firebase-admin/auth";
import { type Firestore } from "firebase-admin/firestore";
import { authenticateWithToken } from "./authenticateWithToken";
import { corsGet } from "./testHelper";
import crypto from "crypto";

const app = {} as App;

describe.concurrent("authenticateWithToken", () => {
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

    const resSend = vi.fn();
    const resSet = vi.fn();
    const res = {
      send: resSend,
      set: resSet,
    } as unknown as Response;

    const createCustomToken = vi.fn().mockResolvedValue(customToken);
    const auth = { createCustomToken } as unknown as Auth;

    const data = () => ({ token });
    const get = () => ({ data });
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });
    const db = { collection } as unknown as Firestore;

    await authenticateWithToken(app, req, res, auth, db);
    expect(collection.mock.calls[0][0]).toBe("users");
    expect(doc.mock.calls[0][0]).toBe(uid);
    expect(createCustomToken.mock.calls[0][0]).toBe(uid);
    expect(resSend.mock.calls[0][0]).toBe(customToken);
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

    const resSend = vi.fn();
    const resStatus = vi.fn().mockReturnValue({ send: resSend });
    const resSet = vi.fn();
    const res = {
      set: resSet,
      status: resStatus,
    } as unknown as Response;

    const createCustomToken = vi.fn().mockResolvedValue(customToken);
    const auth = { createCustomToken } as unknown as Auth;

    const data = () => ({ token });
    const get = () => ({ data });
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });
    const db = { collection } as unknown as Firestore;

    await authenticateWithToken(app, req, res, auth, db);
    expect(collection.mock.calls[0][0]).toBe("users");
    expect(doc.mock.calls[0][0]).toBe(uid);
    expect(createCustomToken.mock.calls.length).toBe(0);
    expect(resStatus.mock.calls[0][0]).toBe(401);
    expect(resSend.mock.calls[0][0]).toEqual({});
  });
});

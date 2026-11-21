
import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

/* ============================================================
   FIREBASE ADMIN — SERVER ONLY

   Supported credentials:
   1. FIREBASE_SERVICE_ACCOUNT_JSON
   2. FIREBASE_SERVICE_ACCOUNT_BASE64
   3. Individual environment variables:
      FIREBASE_PROJECT_ID
      FIREBASE_CLIENT_EMAIL
      FIREBASE_PRIVATE_KEY

   Safe for Next.js development and Vercel serverless.
============================================================ */

let firebaseAdminApp: App | null = null;

/* ============================================================
   TYPES
============================================================ */

interface FirebaseServiceAccount {
  project_id?: string;
  projectId?: string;

  client_email?: string;
  clientEmail?: string;

  private_key?: string;
  privateKey?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function normalizePrivateKey(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function parseServiceAccount(
  raw: string
): FirebaseServiceAccount {
  try {
    return JSON.parse(raw) as FirebaseServiceAccount;
  } catch {
    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Expected valid JSON."
    );
  }
}

function getServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const base64Value = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  let account: FirebaseServiceAccount = {};

  // Option 1: JSON environment variable
  if (jsonValue?.trim()) {
    account = parseServiceAccount(jsonValue.trim());
  }

  // Option 2: Base64 encoded JSON
  else if (base64Value?.trim()) {
    try {
      const decoded = Buffer.from(
        base64Value.trim(),
        "base64"
      ).toString("utf8");

      account = parseServiceAccount(decoded);
    } catch {
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 value."
      );
    }
  }

  // Option 3: Individual environment variables
  const projectId =
    account.project_id ||
    account.projectId ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT;

  const clientEmail =
    account.client_email ||
    account.clientEmail ||
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey = normalizePrivateKey(
    account.private_key ||
      account.privateKey ||
      process.env.FIREBASE_PRIVATE_KEY ||
      ""
  );

  // Firebase credentials are not configured.
  if (!projectId && !clientEmail && !privateKey) {
    return null;
  }

  // Partial configuration is an error.
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Incomplete Firebase credentials. Configure project ID, client email and private key."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

/* ============================================================
   INITIALIZATION

   Reuse existing Firebase Admin app.
   Never initialize multiple default apps.
============================================================ */

function initializeFirebaseAdmin(): App | null {
  try {
    // Reuse existing app during Next.js hot reload.
    if (getApps().length > 0) {
      return getApp();
    }

    const serviceAccount = getServiceAccount();

    if (!serviceAccount) {
      console.warn(
        "[Firebase Admin] Credentials are not configured. Push notifications are disabled."
      );

      return null;
    }

    const app = initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),

      projectId: serviceAccount.projectId,
    });

    console.info(
      "[Firebase Admin] Initialized successfully."
    );

    return app;
  } catch (error) {
    console.error(
      "[Firebase Admin] Initialization failed:",
      error instanceof Error ? error.message : error
    );

    throw error;
  }
}

/* ============================================================
   EXPORTS
============================================================ */

firebaseAdminApp = initializeFirebaseAdmin();

export { firebaseAdminApp };

export default firebaseAdminApp;

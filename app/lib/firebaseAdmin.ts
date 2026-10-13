import {
  getApps,
  initializeApp,
  cert,
  getApp,
  type App,
} from 'firebase-admin/app';

/* ============================================================
   ✅ adminApp ہمیشہ App رہے گا — نہ null، نہ undefined
   اگر config غائب ہو تو یہیں error پھینکے گا (fail-fast)
   ============================================================ */

function initAdminApp(): App {
  /* پہلے سے initialized؟ وہی واپس کریں */
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebaseAdmin] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY env variables'
    );
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getApp();
}

export const adminApp: App = initAdminApp();

export default adminApp;
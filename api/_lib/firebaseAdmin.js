import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured.");

  const serviceAccount = JSON.parse(serviceAccountJson);
  serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminStorage = () => getStorage(getAdminApp());

import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw new Error("Verify your email address before signing in.");
  }
  return credential;
}

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export const resendVerificationEmail = (user) => sendEmailVerification(user);
export const requestPasswordReset = (email) =>
  sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  });
export const verifyResetCode = (code) => verifyPasswordResetCode(auth, code);
export const resetPassword = (code, password) => confirmPasswordReset(auth, code, password);
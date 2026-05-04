"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Wraps children in the Google Identity Services context. The clientId is
 * baked in at build time via NEXT_PUBLIC_GOOGLE_CLIENT_ID — see frontend/.env*.
 *
 * If the env var isn't set we render children unchanged: the rest of the app
 * still works, only the Google sign-in button will be a no-op (and we render
 * a fallback in <GoogleSignInButton/> when that's the case).
 */
export default function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) return <>{children}</>;

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

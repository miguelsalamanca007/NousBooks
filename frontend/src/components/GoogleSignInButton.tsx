"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

/**
 * "Sign in with Google" button. Renders Google's official button, gets an
 * ID token, exchanges it with our backend for a JWT, and routes the user
 * to the dashboard on success.
 *
 * If NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured we render nothing (the
 * provider noops in that case, and the GoogleLogin component would show a
 * broken state). This keeps local dev usable without OAuth set up.
 */
export default function GoogleSignInButton() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [error, setError] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  async function handleSuccess(credentialResponse: CredentialResponse) {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("No credential returned by Google.");
      return;
    }
    try {
      const { token } = await authApi.google(idToken);
      setToken(token);
      router.push("/dashboard");
    } catch {
      setError("Could not sign in with Google. Try again.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("Google sign-in was cancelled or failed.")}
        theme="outline"
        size="large"
        width="320"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

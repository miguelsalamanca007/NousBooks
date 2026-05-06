/**
 * Heads-up shown on the auth pages: the backend is hosted on a free tier that
 * spins down after periods of inactivity, so the very first request after a
 * cold start can take 1–2 minutes while the server boots. Showing this up
 * front prevents users from assuming the app is broken when they hit "Sign in"
 * and nothing seems to happen.
 */
export default function ColdStartNotice() {
  return (
    <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
      ⏱ First request may take 1–2 min to wake the server up.
    </p>
  );
}

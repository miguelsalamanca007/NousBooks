/**
 * Heads-up shown on the auth pages: the backend is hosted on a free tier that
 * spins down after periods of inactivity, so the very first request after a
 * cold start can take 1–2 minutes while the server boots. Showing this up
 * front prevents users from assuming the app is broken when they hit "Sign in"
 * and nothing seems to happen.
 */
export default function ColdStartNotice() {
  return (
    <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-200">
      <span>⏱</span>
      <span>First request may take 1–2 min to wake the server up.</span>
    </p>
  );
}

import type { NextConfig } from "next";

// ─── Environment label (drives <EnvBadge />) ─────────────────────────────────
// Derived from the git branch Railway deployed from. RAILWAY_GIT_BRANCH is
// injected by Railway at BUILD time, and NEXT_PUBLIC_* is inlined into the bundle
// at build — so changing branch/env requires a REDEPLOY, not just a restart.
//   main → production   staging → staging   any other branch → dev   none → local
// An explicit NEXT_PUBLIC_APP_ENV always wins (escape hatch / non-Railway hosts).
const branch = process.env.RAILWAY_GIT_BRANCH ?? "";
const appEnv =
  process.env.NEXT_PUBLIC_APP_ENV ??
  (branch === "main"
    ? "production"
    : branch === "staging"
      ? "staging"
      : branch
        ? "dev"
        : "local");

const nextConfig: NextConfig = {
  // Admin dashboard is fully client-side for API calls; disable static export
  env: {
    NEXT_PUBLIC_APP_ENV: appEnv,
    NEXT_PUBLIC_GIT_BRANCH: branch,
    NEXT_PUBLIC_GIT_SHA: (process.env.RAILWAY_GIT_COMMIT_SHA ?? "").slice(0, 7),
  },
};

export default nextConfig;

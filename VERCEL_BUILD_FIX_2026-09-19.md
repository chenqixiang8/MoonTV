# Vercel build fix

- Removed runtime assignments to `process.env.NEXT_PUBLIC_*`; Next.js inlines these build-time variables and produced invalid assignments such as `"true" = ...`.
- Rebuilt the first-time database setup panel as valid TSX.
- Corrected owner login to use the remotely loaded runtime password.
- Kept the four bootstrap variables: REMOTE_CONFIG_URL, REMOTE_CONFIG_TOKEN, UPSTASH_URL, UPSTASH_TOKEN.

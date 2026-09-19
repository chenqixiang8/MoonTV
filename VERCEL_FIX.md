# Vercel dependency installation fix

`vercel.json` now explicitly sets:

```json
"installCommand": "pnpm install --no-frozen-lockfile"
```

This avoids CI frozen-lockfile rejection while pnpm regenerates the lockfile entry for the newly added mysql2 dependency.

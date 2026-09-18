# Vercel build fix

The project adds `mysql2` to package.json. This package includes `.npmrc` with `frozen-lockfile=false`, allowing Vercel pnpm 10 to update the lockfile during dependency installation instead of failing with ERR_PNPM_OUTDATED_LOCKFILE.

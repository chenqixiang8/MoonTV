# Vercel TypeScript build fix

The cookie helper previously referenced `ownerPassword` outside the POST handler scope. The signing secret is now an explicit helper parameter passed from the request handler for owner and database-mode login cookies.

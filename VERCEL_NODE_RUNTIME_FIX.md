# Vercel Node.js Runtime 修复

数据库层使用 mysql2、fs、path、stream、timers 等 Node.js 模块，因此所有 API 路由已从 Edge Runtime 改为 Node.js Runtime。

Vercel 安装命令继续使用：pnpm install --no-frozen-lockfile

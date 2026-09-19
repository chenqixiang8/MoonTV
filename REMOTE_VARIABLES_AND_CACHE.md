# 远程变量和 Upstash 故障缓存

Vercel 仅保留四项：
- REMOTE_CONFIG_URL=https://speed.728640.xyz:8056/mtv/config.php
- REMOTE_CONFIG_TOKEN=与 config.php 中访问 Token 一致
- UPSTASH_URL=Upstash REST URL，仅用于远程配置故障缓存
- UPSTASH_TOKEN=Upstash REST Token，仅用于远程配置故障缓存

远程配置包含站点名、注册开关、站长账号密码、运行时存储类型、Upstash、Redis、MySQL 和测速配置。远程读取成功后，配置使用由 REMOTE_CONFIG_TOKEN 派生的 AES-256-GCM 密钥加密并缓存到 Upstash 键 `moontv:remote-config:encrypted:v1`。远程服务失联时自动读取该缓存。管理面板“手动更新变量”会强制刷新远程配置及 Upstash 缓存。

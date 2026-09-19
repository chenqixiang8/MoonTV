# MoonTV 远程加密配置部署

1. 将独立 `config.php` 上传到 `speed.728640.xyz:8055/mtv/config.php`。
2. PHP 运行环境设置两个服务器环境变量：
   - `MOONTV_REMOTE_CONFIG_TOKEN`：至少 64 位随机十六进制字符串。
   - `MOONTV_CONFIG_ENCRYPTION_KEY`：与 Token 不同的至少 64 位随机十六进制字符串。
3. 确保 PHP 对 `config.php` 所在目录有写权限。配置数据写入隐藏文件 `.moontv-config.enc`，内容使用 AES-256-GCM 加密。
4. Vercel 设置：
   - `REMOTE_CONFIG_URL=https://speed.728640.xyz:8055/mtv/config.php`
   - `REMOTE_CONFIG_TOKEN` 与 PHP 服务器中的 Token 完全一致。
5. 重新部署 Vercel，然后进入管理面板完成一次连接测试、MySQL 建表和首次配置保存。

安全说明：Origin 检查只作为附加限制，真正身份验证依赖 Bearer Token。所有传输使用 HTTPS，落盘内容使用 AES-256-GCM 加密。

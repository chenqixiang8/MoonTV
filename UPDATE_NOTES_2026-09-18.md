# MoonTV 数据库与自动测速更新

- 新增 MySQL 存储实现，首次配置自动创建 `<前缀>kv` 数据表。
- Redis、Upstash、MySQL 采用同步写入；读取按 Upstash、Redis、MySQL 顺序故障回退。
- 管理面板首次显示数据库初始化设置，成功后自动隐藏。
- 浏览器访问端自动测试豆瓣数据、豆瓣图片和 CDN 候选地址延迟，并保存最低延迟结果。
- 后台可填写 Redis URL、MySQL 地址/端口/账号/密码/数据库/表前缀、Upstash 连接和测速候选地址。
- 设置保存于 `data/database-settings.json`，部署时请持久化 `data` 目录。
- 所有项目更新地址已改为 `github.com/chenqixiang8/MoonTV`。

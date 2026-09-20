# 存储优先级

业务数据读取顺序固定为：
1. Redis
2. MySQL，仅在 Redis 请求失败或失联后使用
3. Upstash，仅在 Redis 与 MySQL 均失败或失联后使用

写操作继续并行同步到 Redis、MySQL、Upstash。远程启动配置仍优先读取 config.php；config.php 失联时使用 Upstash 加密配置缓存，以便 Vercel 冷启动后恢复 Redis 与 MySQL 连接参数。

# 多端配置同步

`.moontv-config.enc` 是远程启动配置主副本；Upstash 的 `moontv:remote-config:encrypted:v1` 是它的加密故障副本；Upstash、Redis、MySQL 的 `admin_config` 保存后台业务配置。

- 后台保存站点设置时，同步写入 Upstash、Redis、MySQL，并将站点名称、公告、豆瓣代理、图片代理、注册设置等写回远程加密配置。
- bj.php 保存后，管理面板点击“手动更新变量”，会把远程配置复制到 Upstash、Redis、MySQL，并刷新 Upstash 故障缓存。

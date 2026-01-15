# wxissb 游戏 Agent 指南

## Supabase 项目信息

- **项目名称**: wxissb-backend
- **项目 ID**: dhlvrnpjcggtxtarpdhf
- **区域**: ap-southeast-1 (Asia-Pacific)
- **组织**: pro付费 (prfrkegvkbuqzmduzqxj)

## 数据库表

### leaderboard 表
存储全球排行榜数据

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| player_name | TEXT | 玩家名称 |
| score | INTEGER | 战力评分 |
| level | INTEGER | 到达等级 |
| kills | INTEGER | 击杀数量 |
| survival_time | INTEGER | 存活时间（秒） |
| tier | TEXT | 段位（SSS/SS/S/A/B/C/D） |
| created_at | TIMESTAMP | 创建时间 |

## 实时联机

使用 Supabase Realtime Broadcast 实现玩家位置同步：
- 房间频道格式: `room:{room_id}`
- 广播事件: `player_position`
- 数据格式: `{ playerId, x, y, color }`

## 开发说明

- 使用中文创建 PR 和与用户沟通
- 本地测试: `python -m http.server 8000`
- 访问: http://localhost:8000

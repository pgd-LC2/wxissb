# wxissb 游戏 Agent 指南

## Supabase 项目信息

- **项目名称**: wxissb-backend
- **项目 ID**: dhlvrnpjcggtxtarpdhf
- **区域**: ap-southeast-1 (Asia-Pacific)
- **组织**: pro付费 (prfrkegvkbuqzmduzqxj)

## 数据库表

### leaderboard 表

存储全球排行榜数据

| 字段          | 类型      | 说明                     |
| ------------- | --------- | ------------------------ |
| id            | UUID      | 主键，自动生成           |
| player_name   | TEXT      | 玩家名称                 |
| score         | INTEGER   | 战力评分                 |
| level         | INTEGER   | 到达等级                 |
| kills         | INTEGER   | 击杀数量                 |
| survival_time | INTEGER   | 存活时间（秒）           |
| tier          | TEXT      | 段位（SSS/SS/S/A/B/C/D） |
| created_at    | TIMESTAMP | 创建时间                 |

## 开发说明

- 使用中文创建 PR 和与用户沟通
- 本地测试: `python -m http.server 8000`
- 访问: http://localhost:8000
- 可以创建scripts文件夹用于执行python脚本操作 记得用完删了
- 在每次工作完给用户一个commit留言
- 在每次更新完游戏功能 将version.txt的小版本 加1

### 版本历史记录

每次增加功能或修复问题时，需要在 `history/` 文件夹中创建对应版本号的更新日志文件。

**文件命名格式**: `{版本号}.md`，例如 `1.0.5.md`

**文件内容模板**:
```markdown
# 版本 {版本号} 更新日志

**发布日期**: YYYY-MM-DD

## 新增功能 / 修复内容

### 功能/问题标题

**问题描述**：
- 描述问题或新功能需求

**修复方案 / 实现方案**：
1. 具体修改内容

**修改文件**：
- 列出修改的文件

**相关 PR**：
- PR 链接
```

### 文件编码要求

- 所有文件统一采用 UTF-8 编码。禁止使用其他编码方式进行查看、编辑或保存。
- Windows PowerShell 的默认写入编码不是 UTF-8（通常为 ANSI 或 UTF-16），因此不得使用 PowerShell 操作相关文件。会导致文件内容乱码。
- 如果需要在 PowerShell 中操作文件，请确保使用 `Get-Content` 和 `Set-Content` 等 cmdlet 时指定 `-Encoding UTF8` 参数。
  在遇到文件乱码的时候需要及时使用git回滚到上一个版本，避免文件内容被损坏。

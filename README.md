# Secure Chat - 仿微信高安全聊天系统

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)
![Security](https://img.shields.io/badge/Security-RSA%20%2B%20AES-green.svg)

## 📖 项目简介

**Secure Chat** 是一个仿微信 UI 设计的现代化在线聊天 Web 应用。本项目核心关注**数据隐私与通信安全**，前端采用 React 19 + TypeScript 构建，内置模拟了端到端（E2E）加密传输流程。

项目不仅还原了微信的经典交互体验（如聊天气泡、表情面板、文件发送），还严格遵循企业级后端开发规范设计了数据库结构，支持从单体到分布式的平滑扩展。

---

## ✨ 核心功能

### 1. 即时通讯
- **多消息类型支持**：支持发送纯文本、Emoji 表情、动态贴纸（Stickers）以及图片文件。
- **实时交互模拟**：基于 WebSocket 机制（Mock）实现的低延迟消息推送。
- **状态感知**：支持消息已读/未读状态、撤回功能（数据库层支持）。

### 2. 安全加密机制
采用 **RSA + AES 混合加密** 方案，确保数据在传输层即使被拦截也无法破解：
- **握手阶段**：客户端获取服务器 RSA 公钥。
- **传输阶段**：客户端生成临时的 AES-256-GCM 密钥，加密业务数据。
- **密钥封装**：使用服务器 RSA 公钥加密 AES 密钥，随数据一同发送。
- **本地解密**：拥有私钥的一方才能解密 AES 密钥，进而解密数据。

### 3. 联系人管理
- **好友系统**：支持用户搜索（ID/昵称）、添加好友。
- **备注功能**：支持给好友设置备注（Remark），优先显示备注名。
- **智能排序**：侧边栏根据最后一条消息的时间自动排序。

### 4. 个性化设置
- **个人资料**：修改头像、昵称。
- **沉浸式体验**：支持自定义侧边栏背景和聊天窗口背景（Wallpaper），支持上传图片。

---

## 🛠 技术架构

### 前端技术栈
- **核心框架**: React 19
- **语言**: TypeScript (严格类型检查)
- **样式**: Tailwind CSS (原子化 CSS)
- **图标库**: FontAwesome
- **加密库**: Web Crypto API (原生浏览器标准，无第三方依赖)

### 后端设计规范 (Spring Boot 适配)
虽然当前演示版本使用 `mockBackend.ts` 进行无服务器模拟，但数据库和接口设计完全遵循 Java/Spring Boot 开发规范：

- **API 风格**: RESTful API
- **数据传输**: JSON (加密 Payload)
- **ID 生成策略**: 雪花算法或数据库自增 (起始 10000)
- **数据库**: MySQL 8.0+ (InnoDB 引擎)

---

## 💾 数据库设计 (Schema)

数据库经过高度优化，统一使用 `BIGINT UNSIGNED` 作为主键，满足高性能需求。

| 表名 | 说明 | 核心字段 |
| :--- | :--- | :--- |
| **users** | 用户表 | `id` (Auto Inc 10000+), `username`, `password_hash`, `status` |
| **contacts** | 联系人表 | `user_id`, `friend_id`, `remark`, `status` (双向关系) |
| **messages** | 消息表 | `sender_id`, `receiver_id`, `msg_type`, `is_read`, `created_at` (MS) |
| **stickers** | 表情包表 | `url`, `set_name`, `sort_order` |
| **files** | 文件记录 | `file_path`, `file_url`, `mime_type` |

*详细 DDL 请参考项目根目录下的 `ddl.md` 文件。*

---

## 🚀 快速开始

### 前置要求
- Node.js 18.0 或更高版本
- npm 或 yarn

### 安装与运行

本项目是一个标准的 React 应用结构。

1. **获取代码**
   ```bash
   git clone <repository-url>
   cd secure-chat
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:5173` (端口取决于 Vite 配置)。

### 演示账号
系统内置了演示账号，ID 从 10001 开始：

- **账号 1**: `alice` / `123`
- **账号 2**: `bob` / `123`

---

## 📂 目录结构

```text
/
├── components/       # UI 组件 (Sidebar, MessageList, InputArea...)
├── services/         # 业务逻辑层
│   ├── api.ts              # 统一 API 接口封装
│   ├── encryptionService.ts # RSA/AES 加密服务
│   └── mockBackend.ts      # 后端逻辑模拟 & 内存数据库
├── types.ts          # TypeScript 类型定义
├── constants.ts      # 常量数据
├── ddl.md            # MySQL 数据库建表语句
├── index.html        # 入口 HTML
└── App.tsx           # 主应用入口
```

---

## 🛡️ 安全性说明

本项目演示了**应用层加密**的概念。在真实生产环境中：
1. **HTTPS**: 必须强制开启 HTTPS 以防止中间人攻击。
2. **密钥管理**: 真实的私钥应存储在后端 HSM 或安全的密钥管理服务中，绝不应暴露在前端代码或 Git 仓库中。
3. **鉴权**: 应结合 JWT 或 OAuth2.0 进行用户会话管理。

---

## 📜 许可证

MIT License

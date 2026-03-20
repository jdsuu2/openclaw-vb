# openclaw-vb 🦞

> **通过 Vibe Coding 个性化定制的 OpenClaw 助手配置**
> **Personalized OpenClaw assistant configuration built with Vibe Coding**

这个仓库是基于 [OpenClaw](https://github.com/openclaw/openclaw) 的个性化定制工作空间，专为 **Vibe Coding** 工作流优化——让 AI 助手真正融入你的编程节奏。

A personalized workspace configuration for [OpenClaw](https://github.com/openclaw/openclaw), optimized for the **Vibe Coding** workflow — letting your AI assistant truly sync with your coding rhythm.

---

## 什么是 Vibe Coding？ / What is Vibe Coding?

Vibe Coding 是一种拥抱流动、直觉和 AI 协作的编程方式。核心理念：

- 🌊 **流动优先**：保持心流状态，让 AI 处理细节
- ⚡ **快速迭代**：先让它跑起来，然后优化
- 🤝 **AI 协作**：AI 不只是工具，更是编程伙伴
- 🎯 **意图驱动**：描述你想要什么，AI 帮你实现

Vibe Coding embraces flow, intuition, and AI collaboration. The core idea: describe what you want, let AI handle implementation details, and iterate fast.

---

## 工作空间文件 / Workspace Files

| 文件 / File | 用途 / Purpose |
|---|---|
| `workspace/SOUL.md` | 助手个性与价值观 / Assistant personality & values |
| `workspace/IDENTITY.md` | 助手身份（VibeClaw 🦞）/ Assistant identity |
| `workspace/AGENTS.md` | 工作空间操作指南 / Workspace operating guide |
| `workspace/USER.md` | 用户档案（填写你的信息）/ User profile (fill yours in) |
| `workspace/TOOLS.md` | 工具与环境配置 / Tool & environment config |
| `workspace/HEARTBEAT.md` | 定期检查清单 / Periodic task checklist |
| `openclaw.json` | 主配置文件模板 / Main config template |

---

## 快速开始 / Quick Start

### 1. 安装 OpenClaw / Install OpenClaw

```bash
# macOS
brew install openclaw

# 或直接用 npm / Or via npm
npm install -g openclaw
```

### 2. 克隆此仓库作为工作空间 / Clone this repo as your workspace

```bash
git clone https://github.com/jdsuu2/openclaw-vb ~/.openclaw/workspace
```

### 3. 配置 OpenClaw / Configure OpenClaw

```bash
# 复制配置模板 / Copy config template
cp ~/.openclaw/workspace/openclaw.json ~/.openclaw/openclaw.json
```

编辑 `~/.openclaw/openclaw.json`：
- 填入你的 API 密钥（通过 `.env` 文件或环境变量）
- 取消注释你想用的渠道（WhatsApp/Telegram/Discord）
- 填写 `allowFrom` 白名单

Edit `~/.openclaw/openclaw.json`:
- Add your API keys (via `.env` or environment variables)
- Uncomment the channels you want to use (WhatsApp/Telegram/Discord)
- Fill in your `allowFrom` allowlist

### 4. 个性化用户档案 / Personalize your profile

编辑 `~/.openclaw/workspace/workspace/USER.md`，填写你的信息：

```markdown
- **Name:** 你的名字
- **Timezone:** Asia/Shanghai
- **Primary languages:** Python, TypeScript
...
```

### 5. 设置 API 密钥 / Set up API keys

```bash
# 创建 .env 文件（不要提交到 git！）
# Create .env file (don't commit to git!)
cat > ~/.openclaw/.env << 'EOF'
# 至少设置一个 / Set at least one
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=...

# 渠道密钥（按需 / As needed）
# TELEGRAM_BOT_TOKEN=...
# DISCORD_BOT_TOKEN=...
EOF
```

### 6. 启动助手 / Start the assistant

```bash
# 初始设置 / Initial setup
openclaw setup

# 启动网关 / Start gateway
openclaw gateway

# 或者连接渠道 / Or connect a channel
openclaw channels login  # WhatsApp
```

---

## Vibe Coding 使用技巧 / Vibe Coding Tips

### 开始一个 coding 会话 / Start a coding session

直接描述你的想法，VibeClaw 会帮你落地：

```
我想做一个简单的 todo app，用 React + TypeScript，
先搭起基本框架，支持增删改查就行
```

```
I want to build a simple todo app with React + TypeScript,
just scaffold the basic structure with CRUD operations
```

### 调试模式 / Debug mode

```
这段代码报错了，帮我看看：
[粘贴代码和错误信息]
```

### 重置会话 / Reset session

```
/new      # 开始新会话 / Start new session
/reset    # 同上 / Same
/重置     # 中文版 / Chinese version
```

### 启用心跳（在你信任设置后）/ Enable heartbeat (after you trust the setup)

编辑 `~/.openclaw/openclaw.json`：

```json5
agent: {
  heartbeat: { every: "30m" },
}
```

---

## 定制化 / Customization

### 修改助手个性 / Modify assistant personality

编辑 `workspace/SOUL.md` — 这是助手的"灵魂"，描述它的价值观和工作方式。

### 更换模型 / Switch model

在 `openclaw.json` 中修改：

```json5
agent: {
  model: "openai/gpt-4o",  // 或 "google/gemini-2-5-pro"
}
```

### 添加自定义触发词 / Add custom trigger words

```json5
routing: {
  groupChat: {
    mentionPatterns: ["@你的助手名", "助手"],
  },
},
```

---

## 文件结构 / File Structure

```
openclaw-vb/
├── README.md              # 本文件 / This file
├── openclaw.json          # 配置模板 / Config template
└── workspace/             # OpenClaw 工作空间 / OpenClaw workspace
    ├── AGENTS.md          # 工作空间指南 / Workspace guide
    ├── SOUL.md            # 助手个性 / Assistant personality
    ├── IDENTITY.md        # 助手身份 / Assistant identity
    ├── USER.md            # 用户档案 / User profile
    ├── TOOLS.md           # 工具配置 / Tool config
    ├── HEARTBEAT.md       # 心跳任务 / Heartbeat tasks
    └── memory/            # 记忆文件（运行时生成）/ Memory files (runtime)
```

---

## 相关链接 / Related Links

- [OpenClaw 官方仓库 / Official repo](https://github.com/openclaw/openclaw)
- [OpenClaw 文档 / Docs](https://docs.openclaw.ai)
- [OpenClaw 中文社区 / Chinese community](https://github.com/openclaw/openclaw/tree/main/docs/zh-CN)
- [ClawHub 技能库 / Skill directory](https://clawhub.ai)

---

## 许可证 / License

MIT — 随意 fork 和定制 / Feel free to fork and customize.
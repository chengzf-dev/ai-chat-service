# AI Chat Service

一个基于 Cloudflare Workers 的 AI 聊天服务，使用 GraphQL 和 TypeScript 构建。

## 功能特性

- 🚀 基于 Cloudflare Workers 的无服务器架构
- 📊 GraphQL API 接口
- 🤖 ChatGPT 集成（支持 GPT-3.5-turbo 和 GPT-4）
- 🔒 TypeScript 类型安全
- 🌐 CORS 支持
- 🎮 内置 GraphQL Playground
- 📝 Mock 响应（当未配置 API key 时）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

```bash
npm run dev
```

服务将在 `http://localhost:8787` 启动。

### 3. 访问 GraphQL Playground

打开浏览器访问 `http://localhost:8787` 或 `http://localhost:8787/playground`

## API 端点

- **GraphQL API**: `/graphql`
- **健康检查**: `/health`
- **GraphQL Playground**: `/` 或 `/playground`

## GraphQL Schema

### 查询 (Queries)

```graphql
# 简单的 Hello 查询
query {
  hello
}

# 聊天查询
query {
  chat(message: "你好，你是谁？") {
    id
    message
    timestamp
    model
  }
}
```

### 变更 (Mutations)

```graphql
# 发送消息
mutation {
  sendMessage(input: {
    message: "请介绍一下人工智能"
    model: "gpt-3.5-turbo"
  }) {
    id
    message
    timestamp
    model
  }
}
```

## 环境配置

### 开发环境

环境变量在 `wrangler.jsonc` 中配置：

```json
{
  "vars": {
    "OPENAI_MODEL": "gpt-3.5-turbo",
    "MAX_TOKENS": "1000",
    "TEMPERATURE": "0.7",
    "ENVIRONMENT": "development"
  }
}
```

### 生产环境

使用 Wrangler 设置敏感信息作为 secrets：

```bash
# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY

# 可选：设置允许的 CORS 源
wrangler secret put ALLOWED_ORIGINS
```

## 部署

### 部署到 Cloudflare Workers

```bash
# 部署到生产环境
npm run deploy

# 或者使用 wrangler 直接部署
wrangler deploy
```

### 部署前准备

1. 确保已登录 Cloudflare 账户：
   ```bash
   wrangler auth login
   ```

2. 设置必要的 secrets：
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

## 项目结构

```
ai-chat-service/
├── src/
│   ├── index.ts          # Worker 主入口文件
│   ├── schema.ts         # GraphQL Schema 和 Resolvers
│   └── chatgpt.ts        # ChatGPT 服务集成
├── test/                 # 测试文件
├── wrangler.jsonc        # Cloudflare Workers 配置
├── tsconfig.json         # TypeScript 配置
├── package.json          # 项目依赖和脚本
└── README.md            # 项目说明
```

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run deploy` - 部署到 Cloudflare Workers
- `npm run test` - 运行测试
- `npm run cf-typegen` - 生成 Cloudflare 类型定义

## 注意事项

1. **API Key 配置**: 如果没有配置 OpenAI API key，服务会返回 mock 响应
2. **CORS**: 默认允许所有源，生产环境建议配置 `ALLOWED_ORIGINS`
3. **速率限制**: 建议在生产环境中实现适当的速率限制
4. **错误处理**: 服务包含完整的错误处理和日志记录

## 开发说明

### 添加新的 GraphQL 类型

在 `src/schema.ts` 中添加新的类型定义和 resolvers。

### 扩展 ChatGPT 功能

在 `src/chatgpt.ts` 中扩展 `ChatGPTService` 类的功能。

### 自定义中间件

在 `src/index.ts` 中添加新的路由处理器或中间件。

## 许可证

MIT License
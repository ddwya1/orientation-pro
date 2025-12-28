# Orientation Pro (角色卡性向转换智能工作站)

一个智能转换角色卡性向（BG ↔ BL）的 React 应用。

## ✨ 功能特性

- 🔄 支持 PNG 和 JSON 格式的角色卡导入/导出
- 🎯 智能内容分段，根据长度自动分组任务
- 📝 回填编辑功能，支持 AI 结果回填
- 🎨 现代化 UI 设计，支持移动端
- 💾 保留原始格式（PNG/JSON）
- 🐳 Docker 一键部署

## 🚀 快速开始

### Docker 部署（推荐）

确保已安装 [Docker](https://www.docker.com/get-started) 和 [Docker Compose](https://docs.docker.com/compose/install/)。

#### 使用 Docker Compose（最简单）

```bash
# 构建并启动
docker-compose up -d

# 访问 http://localhost
```

#### 使用 Docker 命令

```bash
# 构建镜像
docker build -t orientation-pro .

# 运行容器
docker run -d -p 80:80 --name orientation-pro orientation-pro

# 访问 http://localhost
```

#### 管理容器

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

## ☁️ Render 部署（推荐，免费）

Render 提供免费的静态网站托管服务，非常适合部署这个项目。

### 方法一：使用 render.yaml（推荐）

1. **将项目推送到 GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push
   ```

2. **在 Render 创建服务**
   - 访问 [render.com](https://render.com) 并登录（可使用 GitHub 账号）
   - 点击 **New +** → **Static Site**
   - 连接你的 GitHub 仓库
   - Render 会自动检测 `render.yaml` 配置
   - 点击 **Create Static Site**

3. **等待部署完成**
   - Render 会自动构建和部署
   - 部署完成后会提供一个 URL（如 `https://orientation-pro.onrender.com`）
   - 其他人可以直接访问这个 URL 使用应用

### 方法二：手动配置

1. **访问 Render Dashboard**
   - 登录 [render.com](https://render.com)

2. **创建静态网站**
   - 点击 **New +** → **Static Site**
   - 连接 GitHub 仓库

3. **配置构建设置**
   - **Name**: `orientation-pro`（或你喜欢的名字）
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: `Node`

4. **点击 Create Static Site**
   - Render 会自动开始构建和部署

### 自动部署

- 每次推送到 GitHub 的 main 分支，Render 会自动重新部署
- 部署通常需要 1-3 分钟

### 自定义域名（可选）

1. 在 Render Dashboard 中进入你的服务
2. 点击 **Settings** → **Custom Domains**
3. 添加你的域名并按照提示配置 DNS

## 🐳 Docker 部署

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+（可选，但推荐）

### 本地 Docker 部署

编辑 `docker-compose.yml`，修改端口映射：

```yaml
ports:
  - "8080:80"  # 将 8080 改为你想要的端口
```

```bash
# 构建并启动
docker-compose up -d
```

### 生产环境部署

```bash
# 构建生产镜像
docker build -t orientation-pro:latest .

# 运行容器（后台运行，自动重启）
docker run -d \
  --name orientation-pro \
  --restart unless-stopped \
  -p 80:80 \
  orientation-pro:latest
```

## 💻 本地开发

### 前置要求

- Node.js 18+ 和 npm/yarn/pnpm

### 安装步骤

```bash
# 1. 克隆仓库
git clone <你的仓库地址>
cd orientation-pro

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器打开 http://localhost:5173
```

### 构建生产版本

```bash
npm run build
```

构建文件会在 `dist/` 目录中。

## 📖 使用说明

1. **上传卡片**：点击"上传卡片"按钮，选择 PNG 或 JSON 格式的角色卡文件
2. **选择目标性向**：在顶部切换 BL/BG 模式
3. **复制任务**：从左侧任务看板选择任务，点击复制图标将任务复制到剪贴板
4. **AI 改写**：将任务内容粘贴到 AI 工具（如 ChatGPT）进行改写
5. **回填结果**：将 AI 返回的结果粘贴到中间编辑区，点击"保存并回填"
6. **导出卡片**：所有任务完成后，点击"导出"按钮下载转换后的卡片

## 📝 常见问题

### Q: Docker 容器启动失败？

- 检查端口 80 是否被占用：`netstat -ano | findstr :80` (Windows) 或 `lsof -i :80` (Mac/Linux)
- 查看容器日志：`docker-compose logs` 或 `docker logs orientation-pro`
- 尝试修改端口映射

### Q: 如何更新应用？

```bash
# 重新构建镜像
docker-compose build

# 或
docker build -t orientation-pro .

# 重启容器
docker-compose up -d
```

### Q: 如何在服务器上部署？

**使用 Render（推荐）**:
1. 将项目推送到 GitHub
2. 在 Render 创建静态网站服务
3. 连接 GitHub 仓库，Render 会自动部署
4. 获得公开 URL，其他人可以直接访问

**使用 Docker**:
1. 将项目上传到服务器（使用 git clone 或 scp）
2. 在服务器上执行：
   ```bash
   docker-compose up -d
   ```
3. 配置反向代理（nginx/caddy）或直接访问服务器 IP:80

### Q: Render 部署后如何更新？

只需将代码推送到 GitHub：
```bash
git add .
git commit -m "更新内容"
git push
```
Render 会自动检测并重新部署（通常 1-3 分钟）。

### Q: 如何访问应用？

- Docker 部署：访问 `http://localhost`（或你配置的端口）
- 本地开发：访问 `http://localhost:5173`

## 📄 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Docker
- Nginx

## 📄 许可证

本项目为私有项目。

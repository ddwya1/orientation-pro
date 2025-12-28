# Orientation Pro (角色卡性向转换智能工作站)

一个智能转换角色卡性向（BG ↔ BL）的 React 应用。

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [上传到 GitHub](#上传到-github)
- [部署指南](#部署指南)
  - [Windows 本地部署](#1-windows-本地部署)
  - [Android 部署](#2-android-部署)
  - [云端部署](#3-云端部署)

---

## ✨ 功能特性

- 🔄 支持 PNG 和 JSON 格式的角色卡导入/导出
- 🎯 智能内容分段，根据长度自动分组任务
- 📝 回填编辑功能，支持 AI 结果回填
- 🎨 现代化 UI 设计，支持移动端
- 💾 保留原始格式（PNG/JSON）

---

## 🚀 快速开始

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

---

## 📤 上传到 GitHub

### 步骤 1: 在 GitHub 创建新仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 **+** 按钮，选择 **New repository**
3. 填写仓库信息：
   - **Repository name**: `orientation-pro` (或其他你喜欢的名字)
   - **Description**: 角色卡性向转换智能工作站
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 **Create repository**

### 步骤 2: 初始化本地 Git 仓库（如果还没有）

```bash
# 在项目根目录执行
git init
```

### 步骤 3: 添加远程仓库

```bash
# 将 <你的用户名> 和 <仓库名> 替换为实际值
git remote add origin https://github.com/<你的用户名>/<仓库名>.git

# 或者使用 SSH（如果你配置了 SSH key）
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
```

### 步骤 4: 添加文件并提交

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: Orientation Pro 角色卡转换工具"

# 如果之前有分支，可能需要设置默认分支
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 步骤 5: 验证

刷新你的 GitHub 仓库页面，应该能看到所有文件都已上传。

### 后续更新代码

```bash
# 1. 查看更改状态
git status

# 2. 添加更改的文件
git add .

# 3. 提交更改
git commit -m "描述你的更改"

# 4. 推送到 GitHub
git push
```

---

## 🌐 部署指南

### 1. Windows 本地部署

#### 方法 A: 开发模式运行（适合开发调试）

```bash
# 1. 安装 Node.js
# 访问 https://nodejs.org 下载并安装 Node.js LTS 版本

# 2. 打开 PowerShell 或 CMD，进入项目目录
cd D:\BL

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev

# 5. 浏览器访问 http://localhost:5173
```

**优点**: 代码修改后自动刷新  
**缺点**: 需要保持终端窗口打开

#### 方法 B: 构建静态文件（适合生产使用）

```bash
# 1. 构建生产版本
npm run build

# 2. 预览构建结果（可选）
npm run preview
```

**使用构建文件**:

1. 构建完成后，`dist/` 文件夹包含所有静态文件
2. 可以使用以下方式部署：

   **方式 1: 使用 VSCode Live Server**
   - 安装 VSCode Live Server 扩展
   - 右键点击 `dist/index.html`
   - 选择 "Open with Live Server"

   **方式 2: 使用 Python 简单服务器**
   ```bash
   # 进入 dist 目录
   cd dist
   
   # Python 3
   python -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   ```
   然后访问 `http://localhost:8080`

   **方式 3: 使用 nginx（适合正式环境）**
   - 下载安装 nginx
   - 将 `dist/` 目录内容复制到 nginx 的 `html` 目录
   - 启动 nginx
   - 访问 `http://localhost`

### 2. Android 部署

#### 方法 A: 使用 Termux + Node.js（在 Android 上运行）

**步骤 1: 安装 Termux**
- 从 [F-Droid](https://f-droid.org/packages/com.termux/) 或 GitHub Releases 下载安装 Termux

**步骤 2: 在 Termux 中安装 Node.js**
```bash
# 更新包管理器
pkg update && pkg upgrade

# 安装 Node.js
pkg install nodejs

# 验证安装
node --version
npm --version
```

**步骤 3: 克隆并运行项目**
```bash
# 安装 git（如果没有）
pkg install git

# 克隆项目（需要先在 GitHub 上创建仓库）
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**步骤 4: 访问应用**
- Termux 会显示服务器地址，通常是 `http://localhost:5173`
- 在 Android 浏览器中访问该地址
- 如果要从其他设备访问，需要知道手机的 IP 地址：
  ```bash
  # 查看 IP 地址
  ifconfig
  
  # 然后访问 http://<手机IP>:5173
  ```

**限制**: Android 设备需要保持 Termux 运行，耗电较快

#### 方法 B: 构建后部署到 Web 服务器（推荐）

1. **在 Windows/Mac/Linux 上构建**
   ```bash
   npm run build
   ```

2. **部署到以下任一平台**:
   - **GitHub Pages** (免费，见下方)
   - **Netlify** (免费)
   - **Vercel** (免费)
   - **Cloudflare Pages** (免费)

3. 然后通过手机浏览器访问部署的 URL

### 3. 云端部署

#### 方法 A: GitHub Pages（免费，最简单）

**步骤 1: 安装 gh-pages**
```bash
npm install --save-dev gh-pages
```

**步骤 2: 修改 package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://<你的用户名>.github.io/<仓库名>"
}
```

**步骤 3: 修改 vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/<仓库名>/',  // 替换为你的仓库名
})
```

**步骤 4: 构建并部署**
```bash
# 构建
npm run build

# 部署到 GitHub Pages
npm run deploy
```

**步骤 5: 启用 GitHub Pages**
1. 进入 GitHub 仓库
2. 点击 **Settings** → **Pages**
3. **Source** 选择 `gh-pages` 分支
4. 点击 **Save**
5. 几分钟后访问 `https://<你的用户名>.github.io/<仓库名>`

#### 方法 B: Vercel（免费，推荐）

**步骤 1: 安装 Vercel CLI**
```bash
npm install -g vercel
```

**步骤 2: 登录 Vercel**
```bash
vercel login
```

**步骤 3: 部署**
```bash
# 在项目根目录执行
vercel

# 或直接部署生产版本
vercel --prod
```

**或使用网页部署**:
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 **New Project**
4. 导入你的 GitHub 仓库
5. 点击 **Deploy**
6. 几分钟后获得部署链接

**优点**: 
- 自动 HTTPS
- 全球 CDN 加速
- 自动部署（推送代码自动更新）

#### 方法 C: Netlify（免费）

**网页部署**:
1. 访问 [netlify.com](https://www.netlify.com)
2. 使用 GitHub 账号登录
3. 点击 **Add new site** → **Import an existing project**
4. 选择你的 GitHub 仓库
5. **Build command**: `npm run build`
6. **Publish directory**: `dist`
7. 点击 **Deploy site**

**CLI 部署**:
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

#### 方法 D: Cloudflare Pages（免费）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 **Pages** → **Create a project**
3. 连接 GitHub 仓库
4. **Build command**: `npm run build`
5. **Build output directory**: `dist`
6. 点击 **Save and Deploy**

---

## 📝 常见问题

### Q: 如何更新代码后重新部署？

**GitHub Pages**:
```bash
npm run build
npm run deploy
```

**Vercel/Netlify/Cloudflare**:
- 如果已连接 GitHub，推送到 main 分支会自动部署
- 或使用 CLI: `vercel --prod` / `netlify deploy --prod`

### Q: 访问 GitHub Pages 显示 404？

- 检查 `vite.config.ts` 中的 `base` 路径是否正确
- 确认 GitHub Pages 源设置为 `gh-pages` 分支
- 等待几分钟让部署生效

### Q: 如何在手机上访问本地部署的应用？

1. 确保手机和电脑在同一 Wi-Fi 网络
2. 查看电脑的 IP 地址（Windows: `ipconfig`，Mac/Linux: `ifconfig`）
3. 在手机浏览器访问 `http://<电脑IP>:5173`（开发模式）或相应端口

### Q: Android Termux 中如何后台运行？

```bash
# 使用 tmux 或 screen
pkg install tmux
tmux

# 在 tmux 中运行
npm run dev

# 按 Ctrl+B 然后 D 退出（进程继续运行）
```

---

## 📄 许可证

本项目为私有项目。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

# ⚡ 快速开始指南

## 📤 上传到 GitHub（5 分钟）

```bash
# 1. 在 GitHub 创建新仓库（网页操作）

# 2. 在项目目录执行：
git init
git remote add origin https://github.com/<用户名>/<仓库名>.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## 🚀 快速部署（推荐 Vercel）

### 最简单的方法：

1. 访问 https://vercel.com
2. 用 GitHub 登录
3. 点击 "New Project" → 选择你的仓库
4. 点击 "Deploy"
5. 等待 1-2 分钟，获得链接！

### 或使用命令行：

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 💻 Windows 本地运行

```bash
# 1. 安装 Node.js: https://nodejs.org

# 2. 在项目目录执行：
npm install
npm run dev

# 3. 浏览器打开 http://localhost:5173
```

## 📱 在手机上使用

**最佳方案：云端部署**
1. 使用上面的 Vercel 部署方法
2. 在手机浏览器访问部署链接

**或在手机上运行：**
1. 安装 Termux (F-Droid)
2. `pkg install git nodejs`
3. `git clone <你的仓库>` → `cd <仓库名>` → `npm install` → `npm run dev`
4. 浏览器访问 `http://localhost:5173`

---

📖 **详细教程请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**


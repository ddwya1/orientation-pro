# 🚀 部署教程 - 小白友好版

这是一份详细的部署教程，适合完全没有经验的新手。

---

## 📤 第一部分：上传到 GitHub

### 准备工作

1. **注册 GitHub 账号**
   - 访问 https://github.com
   - 点击右上角 "Sign up" 注册账号
   - 验证邮箱

2. **安装 Git（如果还没有）**
   - Windows: 访问 https://git-scm.com/download/win 下载安装
   - 安装时一路点击 "Next" 即可
   - Mac: 如果已安装 Xcode，通常已包含 Git
   - Linux: `sudo apt install git` 或 `sudo yum install git`

### 步骤详解

#### 第 1 步：在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角 **+** 号 → **New repository**
3. 填写信息：
   ```
   Repository name: orientation-pro  （可以改成你喜欢的名字）
   Description: 角色卡性向转换工具
   Visibility: 选择 Public（公开）或 Private（私有）
   ⚠️ 重要：不要勾选 "Add a README file"
   ```
4. 点击绿色的 **Create repository** 按钮

#### 第 2 步：打开命令行

**Windows:**
- 按 `Win + R`，输入 `cmd` 或 `powershell`，回车
- 或者在项目文件夹中，按住 `Shift` 键，右键点击空白处，选择 "在此处打开 PowerShell 窗口"

**Mac/Linux:**
- 按 `Cmd + Space`（Mac）或 `Ctrl + Alt + T`（Linux）打开终端

#### 第 3 步：进入项目目录

```bash
# Windows (假设项目在 D:\BL)
cd D:\BL

# Mac/Linux (假设项目在 ~/BL 或 /home/user/BL)
cd ~/BL
```

#### 第 4 步：初始化 Git（如果还没有）

```bash
git init
```

#### 第 5 步：配置 Git 用户信息（首次使用需要）

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

#### 第 6 步：添加远程仓库

```bash
# 将下面的 <你的用户名> 和 <仓库名> 替换成实际值
# 例如：如果你的 GitHub 用户名是 "zhangsan"，仓库名是 "orientation-pro"
# 则命令是：git remote add origin https://github.com/zhangsan/orientation-pro.git

git remote add origin https://github.com/<你的用户名>/<仓库名>.git
```

**如何查看仓库地址？**
- 在 GitHub 仓库页面，点击绿色的 **Code** 按钮
- 复制 HTTPS 地址，就是 `https://github.com/...` 这个

#### 第 7 步：添加文件

```bash
# 添加所有文件
git add .

# 查看状态（可选）
git status
```

#### 第 8 步：提交代码

```bash
git commit -m "第一次提交：Orientation Pro 项目"
```

如果提示需要配置邮箱，回到第 5 步。

#### 第 9 步：推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

**如果要求输入账号密码：**
- 用户名：你的 GitHub 用户名
- 密码：不是 GitHub 密码，而是 Personal Access Token（PAT）
- 如何获取 PAT：
  1. GitHub → 右上角头像 → Settings
  2. 左侧最下方 → Developer settings
  3. Personal access tokens → Tokens (classic)
  4. Generate new token → 勾选 `repo` 权限
  5. 复制生成的 token（只显示一次，要保存好）

#### 第 10 步：验证

刷新 GitHub 仓库页面，应该能看到所有文件了！🎉

---

## 💻 第二部分：Windows 本地部署

### 方法 1：开发模式（适合测试）

#### 安装 Node.js

1. 访问 https://nodejs.org
2. 下载 **LTS 版本**（推荐稳定版）
3. 双击安装，一路 Next
4. 安装完成后，打开命令行验证：
   ```bash
   node --version
   npm --version
   ```
   应该显示版本号

#### 运行项目

1. 打开 PowerShell 或 CMD
2. 进入项目目录：
   ```bash
   cd D:\BL
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
   这个过程可能需要几分钟，耐心等待
4. 启动开发服务器：
   ```bash
   npm run dev
   ```
5. 看到类似这样的输出：
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```
6. 打开浏览器，访问 `http://localhost:5173`

**提示**: 
- 修改代码后，页面会自动刷新
- 按 `Ctrl + C` 可以停止服务器

### 方法 2：构建静态文件（适合正式使用）

```bash
# 1. 构建
npm run build

# 2. 预览（可选）
npm run preview
```

构建完成后，`dist` 文件夹就是可以部署的静态文件。

#### 部署方式

**方式 A：使用 Python 简单服务器**

1. 打开 PowerShell，进入 dist 目录：
   ```bash
   cd dist
   ```
2. 启动服务器：
   ```bash
   # Python 3
   python -m http.server 8080
   
   # 如果没有 Python，先安装 Python，或使用方式 B
   ```
3. 浏览器访问 `http://localhost:8080`

**方式 B：使用 VSCode Live Server**

1. 安装 VSCode
2. 安装 "Live Server" 扩展
3. 右键点击 `dist/index.html`
4. 选择 "Open with Live Server"

**方式 C：直接打开 HTML 文件**

1. 找到 `dist/index.html`
2. 双击打开（功能可能受限，不推荐）

---

## 📱 第三部分：Android 部署

### 方案 1：Termux + Node.js（在手机上运行）

#### 安装 Termux

1. 从 [F-Droid](https://f-droid.org/packages/com.termux/) 下载 APK（推荐，无广告）
2. 或从 [GitHub Releases](https://github.com/termux/termux-app/releases) 下载
3. 安装 APK（可能需要允许"未知来源"安装）

#### 在 Termux 中设置

```bash
# 1. 更新系统
pkg update
pkg upgrade

# 2. 安装必要工具
pkg install git nodejs

# 3. 验证安装
node --version
npm --version
git --version
```

#### 克隆项目

```bash
# 克隆项目（替换为你的仓库地址）
git clone https://github.com/<你的用户名>/<仓库名>.git

# 进入项目目录
cd <仓库名>

# 安装依赖
npm install
```

#### 运行

```bash
npm run dev
```

会显示：
```
➜  Local:   http://localhost:5173/
```

#### 访问

**在手机上访问：**
- 打开手机浏览器
- 访问 `http://localhost:5173`

**从其他设备访问：**
1. 查看手机 IP：
   ```bash
   ifconfig
   # 找到类似 192.168.x.x 的地址
   ```
2. 在电脑或其他设备浏览器访问：
   ```
   http://192.168.x.x:5173
   ```
   （确保手机和访问设备在同一 Wi-Fi 网络）

### 方案 2：使用云端部署（推荐）

由于 Android 上运行 Node.js 耗电且需要保持 Termux 运行，更推荐使用云端部署，然后在手机浏览器访问。

详见下面的"云端部署"部分。

---

## ☁️ 第四部分：云端部署（推荐）

### 方案 1：Vercel（最简单，推荐新手）

#### 方法 A：网页部署（最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 点击 "Sign Up"，使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在 "Import Git Repository" 中找到你的仓库
   - 点击 "Import"

3. **配置项目**
   - Framework Preset: 选择 "Vite"
   - Root Directory: `./`（默认即可）
   - Build Command: `npm run build`（通常自动识别）
   - Output Directory: `dist`（通常自动识别）
   - 点击 "Deploy"

4. **等待部署**
   - 通常 1-2 分钟完成
   - 部署完成后会显示一个链接，例如：`https://your-project.vercel.app`

5. **访问**
   - 点击链接即可访问你的应用
   - 以后每次推送代码到 GitHub，Vercel 会自动重新部署

#### 方法 B：命令行部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 在项目目录执行部署
vercel

# 4. 生产环境部署
vercel --prod
```

### 方案 2：Netlify

1. **访问 Netlify**
   - 打开 https://www.netlify.com
   - 使用 GitHub 账号登录

2. **新建站点**
   - 点击 "Add new site" → "Import an existing project"
   - 选择 "Deploy with GitHub"
   - 授权并选择你的仓库

3. **配置**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - 点击 "Deploy site"

4. **获取链接**
   - 部署完成后获得链接，例如：`https://your-project.netlify.app`

### 方案 3：GitHub Pages（免费，但需要配置）

#### 安装 gh-pages

```bash
npm install --save-dev gh-pages
```

#### 修改 package.json

在 `"scripts"` 部分添加：

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "gh-pages -d dist"
},
"homepage": "https://<你的用户名>.github.io/<仓库名>"
```

#### 修改 vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/<仓库名>/',  // 替换为你的仓库名，例如 '/orientation-pro/'
})
```

#### 部署

```bash
# 构建
npm run build

# 部署
npm run deploy
```

#### 启用 GitHub Pages

1. 进入 GitHub 仓库
2. Settings → Pages
3. Source 选择 `gh-pages` 分支
4. Save
5. 几分钟后访问：`https://<你的用户名>.github.io/<仓库名>`

---

## ❓ 常见问题

### Q1: Git push 时提示认证失败？

**解决方案：**
- 使用 Personal Access Token 而不是密码
- 或者配置 SSH Key（较复杂，不推荐新手）

### Q2: npm install 很慢或失败？

**解决方案：**
- 使用国内镜像（临时）：
  ```bash
  npm install --registry=https://registry.npmmirror.com
  ```
- 或配置永久镜像：
  ```bash
  npm config set registry https://registry.npmmirror.com
  ```

### Q3: 访问 GitHub Pages 显示 404？

**解决方案：**
- 检查 `vite.config.ts` 中的 `base` 路径是否正确
- 确认 GitHub Pages 源设置为 `gh-pages` 分支
- 等待 5-10 分钟让 GitHub 更新

### Q4: Android Termux 中 npm install 失败？

**解决方案：**
- 确保已更新系统：`pkg update && pkg upgrade`
- 如果内存不足，关闭其他应用
- 考虑使用云端部署替代

### Q5: 如何在手机上访问电脑上运行的应用？

1. 确保手机和电脑在同一 Wi-Fi
2. 查看电脑 IP：
   - Windows: 打开 CMD，输入 `ipconfig`，找到 IPv4 地址
   - Mac/Linux: 输入 `ifconfig`，找到 inet 地址
3. 在手机浏览器访问：`http://<电脑IP>:5173`

---

## 📞 需要帮助？

如果遇到问题：
1. 检查错误信息，通常会有提示
2. 搜索错误信息 + "解决方案"
3. 查看项目 README.md
4. 提交 Issue 到 GitHub 仓库

祝你部署顺利！🎉


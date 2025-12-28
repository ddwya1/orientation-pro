import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 如果需要部署到 GitHub Pages，取消下面的注释并替换 <仓库名>
  // base: '/<仓库名>/',
})


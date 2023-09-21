import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//配置路径
import path from "path";
// https://vitejs.dev/config/

const site = "wp-content/plugins/device-manage/";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 指定 chunk 文件名（含导出的代码）
        //chunkFileNames: 'js/[name].js',
        // 指定静态资源文件名（不含导出的代码）
        //assetFileNames: 'assets/[name].[ext]',
        entryFileNames: "index.js",
        assetFileNames: "[name][extname]",
        chunkFileNames: "[name].js",
      },
    },
  },
  //配置路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  //媒体资源打包前缀
  base: site + "vite/dist/",
});

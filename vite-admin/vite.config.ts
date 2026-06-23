import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//配置路径
import path from "path";
// https://vitejs.dev/config/

const site = "/wp-content/plugins/npcink-device-inventory/";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const devProxyTarget = process.env.WP_DEV_PROXY_TARGET;

  return {
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
      //sourcemap: true,//保留映射关系，方便调试
    },
    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },
    //配置路径别名
    resolve: {
      alias: [
        ...(isProd
          ? [
              {
                find: "@/utils/demoConfig",
                replacement: path.resolve(
                  __dirname,
                  "src/utils/demoConfig.prod.ts"
                ),
              },
            ]
          : []),
        { find: "@", replacement: path.resolve(__dirname, "src") },
      ],
    },

    //媒体资源打包前缀，避免图片无法正常显示
    base: site + "vite-admin/dist/",

    //代理
    server: {
      //host: "0.0.0.0",
      //port: 3000,
      //open: true,
      ...(devProxyTarget
        ? {
            proxy: {
              "/wp-json": {
                target: devProxyTarget,
                changeOrigin: true,
              },
              "/api": {
                target: devProxyTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
              },
            },
          }
        : {}),
    },
  };
});

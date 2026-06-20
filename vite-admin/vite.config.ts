import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//配置路径
import path from "path";
// https://vitejs.dev/config/

const site = "/wp-content/plugins/npcink-device-manage/";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

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
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            const reactChunkRE =
              /[\\/]node_modules[\\/](react|react-dom|react-is|scheduler)[\\/]/;
            if (reactChunkRE.test(id)) return "react";
            if (id.includes("@ant-design/icons")) {
              return "antd-icons";
            }
            if (id.includes("@ant-design/cssinjs")) {
              return "antd-style";
            }
            if (/[\\/]antd[\\/]es[\\/](table|pagination|checkbox|dropdown)[\\/]/.test(id)) {
              return "antd-table";
            }
            if (/[\\/]antd[\\/]es[\\/](form|input|input-number|select|radio|switch|date-picker)[\\/]/.test(id)) {
              return "antd-form";
            }
            if (/[\\/]antd[\\/]es[\\/](modal|message|notification|popconfirm|result|empty|spin|skeleton)[\\/]/.test(id)) {
              return "antd-feedback";
            }
            if (id.includes("antd") || id.includes("@ant-design")) {
              return "antd";
            }
            if (id.includes("@rc-component") || /[\\/]rc-/.test(id)) {
              return "rc";
            }
            if (id.includes("@tanstack")) {
              return "query";
            }
            return "vendor";
          },
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
      proxy: {
        "/wp-json": {
          target: "http://localhost:10048/",
          changeOrigin: true,
        },
        "/api": {
          target: "http://localhost:10048/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});

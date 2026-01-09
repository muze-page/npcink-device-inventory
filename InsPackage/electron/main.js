const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// 引入其他的 JavaScript 文件
//require("./get/cpu.js"); //获取CPU信息
//require("./get/memory.js"); //获取内存信息
//显卡
//require("./get/bios.js"); //BIOD信息

//require("./get/displays.js"); //显示器信息
//require("./get/disk.js"); //获取硬盘信息

//require("./get/systen.js"); //获取系统信息
//机箱

//require("./get/baseboard.js"); //主板
//require("./get/chassis.js"); //机箱

//网卡
//电池
//声卡

require("./get/all.js"); //所有信息
//鼠标信息
//键盘信息

//加载主界面
const createWindow = () => {
  const win = new BrowserWindow({
    width: 980,
    height: 580,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      //nodeIntegration: true,//安全问题
    },
  });
  //打包用
  win.loadFile("dist/index.html");
  //开发用
  //win.loadURL("http://localhost:5173/");
};

app.whenReady().then(() => {
  createWindow();
});

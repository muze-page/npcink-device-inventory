//获取内存信息
//https://systeminformation.io/memory.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-memory-info", (event) => {
    si.memLayout().then((data) => {
      const osInfo = data;
      event.reply("memory-info", osInfo);
    });
  });
});

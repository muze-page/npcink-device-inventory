//获取系统信息
//https://systeminformation.io/system.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-system-info", (event) => {
    si.system().then((data) => {
      const osInfo = data;
      event.reply("system-info", osInfo);
    });
  });
});

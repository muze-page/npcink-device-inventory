//显示器信息
//https://systeminformation.io/graphics.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-displays-info", (event) => {
    si.graphics().then((data) => {
      const osInfo = data;
      event.reply("displays-info", osInfo);
    });
  });
});

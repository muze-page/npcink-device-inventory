//主板信息
//https://systeminformation.io/system.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-baseboard-info", (event) => {
    si.baseboard().then((data) => {
      const osInfo = data;
      event.reply("baseboard-info", osInfo);
    });
  });
});

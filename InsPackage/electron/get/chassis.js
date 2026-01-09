//机箱信息
//https://systeminformation.io/system.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");
app.on("ready", () => {
  ipcMain.on("get-chassis-info", (event) => {
    si.chassis().then((data) => {
      const osInfo = data;
      event.reply("chassis-info", osInfo);
    });
  });
});

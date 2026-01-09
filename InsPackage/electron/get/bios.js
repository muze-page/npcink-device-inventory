//BIOS信息
//https://systeminformation.io/system.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-bios-info", (event) => {
    si.bios().then((data) => {
      const osInfo = data;
      event.reply("bios-info", osInfo);
    });
  });
});

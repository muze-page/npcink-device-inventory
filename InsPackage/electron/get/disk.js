//硬盘信息
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-device-info", (event) => {
    si.system().then((data) => {
      // const osInfo = {
      //   ...data,
      //   diskInfo: "硬盘信息",
      // };
      const osInfo = data;
      event.reply("device-info", osInfo);
    });
  });
});

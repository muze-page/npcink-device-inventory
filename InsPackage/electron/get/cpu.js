//获取CPU信息
//https://systeminformation.io/cpu.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-cpu-model", (event) => {
    si.cpu().then((data) => {
      //过滤自己需要的功能，并添加信息名称
      const osInfo = data;
      event.reply("cpu-model", osInfo);
    });
  });
});

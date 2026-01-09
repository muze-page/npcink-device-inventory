//所有硬件信息
//https://systeminformation.io/graphics.html
const { app, ipcMain } = require("electron");
const si = require("systeminformation");

app.on("ready", () => {
  ipcMain.on("get-all-info", (event) => {
    si.getStaticData().then((data) => {
     
      event.reply("all-info", data);
    });
  });
});

"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
require("./get/all.js");
const createWindow = () => {
  const win = new BrowserWindow({
    width: 980,
    height: 580,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts")
      //nodeIntegration: true,//安全问题
    }
  });
  win.loadFile("dist/index.html");
};
app.whenReady().then(() => {
  createWindow();
});

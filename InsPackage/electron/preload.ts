const { contextBridge, ipcRenderer } = require("electron");

//全部信息
let allData;
ipcRenderer.send("get-all-info");
ipcRenderer.on("all-info", (event, data) => {
  console.log(`所有：`);
  console.log(data);
  allData = data;
});


  contextBridge.exposeInMainWorld("versionss", {
    
    all: () => allData,
  });


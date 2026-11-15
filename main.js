const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: "#000",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.setMenuBarVisibility(false);

  if (process.argv.includes("--dev")) win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

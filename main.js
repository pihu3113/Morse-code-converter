const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 680,
    minWidth: 600,
    minHeight: 500,
    resizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, 'preload.js')
    },
    backgroundColor: '#fdf6ff',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  win.loadFile('index.html');

  ipcMain.on('win-minimize', () => win.minimize());
  ipcMain.on('win-close',    () => win.close());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

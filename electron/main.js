const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let server;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startServer(distPath, callback) {
  server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    const filePath = path.join(distPath, url);
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  server.listen(0, '127.0.0.1', () => {
    callback(server.address().port);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 750,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  const distPath = path.join(__dirname, '..', 'dist');
  startServer(distPath, (port) => {
    createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});

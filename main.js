const {
    app,
    BrowserWindow,
    ipcMain,
    net,
    protocol
} = require('electron');

const path = require('node:path');

const {
    pathToFileURL
} = require('node:url');

const {
    searchFoods
} = require('./usda');

const origin = 'app://nutrition/';
const pages = new Set(['index.html', 'diary.html']);
const assets = new Set([...pages, 'styles.css', 'model.mjs', 'common.mjs', 'lookup.mjs', 'diary.mjs']);
// A fixed origin keeps both pages in the same Local Storage area across launches.
protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true
    }
}]);

function openWindow() {
    const win = new BrowserWindow({
        title: 'NutritionPlan',
        width: 1040,
        height: 840,
        minWidth: 660,
        minHeight: 540,
        autoHideMenuBar: true,
        backgroundColor: '#f6f6f1',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false
        }
    });
    win.webContents.setWindowOpenHandler(() => ({
        action: 'deny'
    }));
    win.webContents.on('will-navigate', (event, url) => {
        if (![...pages].some(page => url === origin + page)) event.preventDefault();
    });
    win.loadURL(origin + 'index.html');
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.restore();
            win.focus();
        }
    });
    app.whenReady().then(() => {
        protocol.handle('app', request => {
            const url = new URL(request.url);
            const file = url.pathname.slice(1);
            if (url.host !== 'nutrition' || !assets.has(file)) return new Response('Missing file', {
                status: 404
            });
            return net.fetch(pathToFileURL(path.join(__dirname, 'ui', file)).href);
        });
        ipcMain.handle('food-search', async (event, query) => {
            if (event.senderFrame?.url !== origin + 'index.html') return {
                error: 'Open Food lookup to search.'
            };
            try {
                return {
                    foods: await searchFoods(query)
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        });
        openWindow();
        app.on('activate', () => {
            if (!BrowserWindow.getAllWindows().length) openWindow();
        });
    });
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
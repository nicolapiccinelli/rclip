const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow()

  // and load the index.html of the app.
  mainWindow.loadURL(url.format(
    {
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const globalShortcut = electron.globalShortcut;
const ipcMain = electron.ipcMain;
const Menu = electron.Menu;
const Tray = electron.Tray;

const udp = require('dgram');
const ip = require('ip');
const notifier = require('node-notifier');
const clipboardy = require('clipboardy');

const socket = udp.createSocket('udp4');

// App variables
var last_msg = "";
var port = 226644;
var address = ip.address();
var remote_addr = "localhost";

// Setting up try icon
let tray = null
app.on('ready', () => {
  tray = new Tray('./logo.jpg')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit' }])

  // Make a change to the context menu
  contextMenu.items[0].checked = false

  // Call this again for Linux because we modified the context menu
  tray.setContextMenu(contextMenu)

  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)

  bindHotkey();
  remoteConnector();
})

// IPC
ipcMain.on('ready', (event, arg) => {
  event.sender.send('initialization', { addr: address, port: port });
});

ipcMain.on('remoteIpSet', (event, arg) => {
  remote_addr = arg;
  console.log(remote_addr);
})

// Clipboard related functions
function bindHotkey() {
  // Register a shortcut listener.
  const ret_ctrl_c = globalShortcut.register('CmdOrCtrl+Alt+C', () => {
    console.log('CmdOrCtrl+Alt+C is pressed')

    var clip = clipboardy.readSync();
    console.log("Syncronous copied: " + clip)
    send(clip)
  })

  if (!ret_ctrl_c) {
    console.log('registration failed')
  }

  // Register a shortcut listener.
  const ret_ctrl_v = globalShortcut.register('CmdOrCtrl+Alt+V', () => {
    console.log('CmdOrCtrl+Alt+V is pressed')

    var clip = recv();
    clipboardy.writeSync(clip);
  })

  if (!ret_ctrl_v) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log("Global CmdOrCtrl+Alt+C: " + globalShortcut.isRegistered('CmdOrCtrl+Alt+C'))

  // Check whether a shortcut is registered.
  console.log("Global CmdOrCtrl+Alt+V: " + globalShortcut.isRegistered('CmdOrCtrl+Alt+V'))

  app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
  })
}

function send(payload) {
  var data = Buffer.from(payload);

  socket.send(data, port, remote_addr, function (error) {
    if (error) {
      socket.close();
    }
    else {
      console.log('Data sent');
    }
  });

  // Object
  notifier.notify({
    'title': 'Remote Clip',
    'message': 'Your clipboard has been sent'
  });
}

function recv(payload) {
  // Object
  notifier.notify({
    'title': 'Remote Clip',
    'message': 'Your clipboard has been updated'
  });

  return last_msg;
}

function remoteConnector() {
  // emits when any error occurs
  socket.on('error', function (error) {
    console.log('Error: ' + error);
    socket.close();
  });

  //emits when socket is ready and listening for datagram msgs
  socket.on('listening', function () {
    var address = socket.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;

    console.log('App is listening at port: ' + port);
    console.log('App ip: ' + ipaddr);
    console.log('App is IP4/IP6: ' + family);
  });

  //emits after the socket is closed using socket.close();
  socket.on('close', function () {
    console.log('Socket is closed !');
  });

  // emits on a new message received
  socket.on('message', function (msg, info) {
    console.log('Data received from app: ' + msg.toString());
    console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);

    last_msg = msg.toString();
  });

  socket.bind(port);
}
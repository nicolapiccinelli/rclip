// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var { ipcRenderer, remote } = require('electron');
var main = remote.require("./main.js");

// configuration form elements
var l_ip = document.getElementById("local-ip");
var r_ip = document.getElementById("remote-ip");
var l_port = document.getElementById("local-port");

// Send async message to main process
ipcRenderer.send('ready', 1);

// Listen for async-reply message from main process
ipcRenderer.on('initialization', (event, arg) => {
    console.log(arg);
    l_ip.innerHTML = arg.addr;
    l_port.innerHTML = arg.port;
    r_ip.innerHTML = arg.remote;
});

ipcRenderer.on('remote_ip_set_done', (event, arg) => {
    console.log(arg);
    r_ip.innerHTML = arg.addr;
});

document.querySelector('#set_remote_ip').addEventListener('click', function ()
{
    var val = document.getElementById('remote_ip').value;
    ipcRenderer.send("remote_ip_set", val);
})
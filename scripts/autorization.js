import React from 'react';
import ReactDOM from 'react-dom';
import MainAuto from '../views/autorization/mainAuto.jsx';

const { ipcRenderer } = require('electron')
const remote = require('electron').remote
const {BrowserWindow} = require('electron').remote
const { shell } = require('electron')
const path = require('path')
const url = require('url')
const $ = require('./jquery.js')
const storage = require('electron-json-storage');


window.onload = function() {
    if (localStorage.ya_account != null && localStorage.Token != null && localStorage.access_token != null) {
        storage.set('auth', true, function(error) {
            if (error) console.log(error);
        });
        ipcRenderer.send('show-main-from-auto')

    }

    ReactDOM.render( < MainAuto /> , document.getElementsByClassName('container')[0])

    let links = document.getElementsByTagName('li')

    let enter = links.item(0)
    let enter_qiwi = links.item(1)
    let registration = links.item(2)
    let exit = links.item(3)

    enter_qiwi.onclick = () => {
       let  authWindow = new BrowserWindow({
            width: 530,
            frame: false,
            height: 400,
            type: 'splash',
            show: false
        });

        authWindow.loadURL('file://' + __dirname + '/../HTMLs/qiwi.html');
        authWindow.on('closed', () => {
            authWindow = null;
            if (localStorage.qiwi_token){
                storage.set('auth', true, function(error) {
                                if (error) console.log(error);
                            });
                ipcRenderer.send('show-main-from-auto')
            }
        })
        authWindow.once('ready-to-show', () => {
            authWindow.show()
        })
    }

    enter.onclick = () => {

        let authWindow
        var querystring = require('querystring');
        var https = require("https");
        var clientId = '880A4ADB0EEA4DABAA6B65ECCB91B71A47EBBFD54F129B7A47CC65D0322FD7B6';
        var scope = ['account-info', 'operation-history', 'operation-details'];
        var authUrl = 'https://money.yandex.ru/oauth';
        var apiUrl = 'https://money.yandex.ru/api';
        var redirect_url = 'https://bkjjipopfjknbeabnlelfhplklgjfcaf.chromiumapp.org';
        var githubUrl = 'https://money.yandex.ru/oauth/authorize?';
        var authUrl = githubUrl + 'client_id=' + clientId +
            '&redirect_uri=' + redirect_url +
            '&scope=' + scope.join(" ") +
            '&response_type=' + 'code';

        authWindow = new BrowserWindow({
            width: 730,
            height: 750,
            type: 'splash',
            webPreferences: {
                nodeIntegration: false
            }
        });

       
        authWindow.webContents.on('will-navigate', function(event, url) {
            console.log(url)
            if (url.includes(redirect_url)){
            let code = url.split('=')[1]
             $.post("http://streambeta.azurewebsites.net/api/oauth", {
                    "code": code,
                    "type": "yandex_money",
                    "streamer": "yes"
                },
                function(data) {
                    console.log(data)
                    localStorage.setItem('Token', data.pass)
                    localStorage.setItem('ym_token', data.access_token)
                    localStorage.setItem('id', data.id)
                     $.ajax({
                        url: 'https://money.yandex.ru/api/account-info',
                        type: 'POST',
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + encodeURIComponent(data.access_token));
                            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        },
                        success: function(response) {
                            authWindow.destroy()
                            storage.set('auth', true, function(error) {
                                if (error) console.log(error);
                            });
                            ipcRenderer.send('show-main-from-auto')
                        },
                        error: function(error) {
                            console.log(JSON.parse(error.responseText));
                        }
                    });
                });
           }
        });

        authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
            let code = newUrl.split('=')[1]
            console.log(code)
            if (newUrl.includes(redirect_url)){

            $.post("http://streambeta.azurewebsites.net/api/oauth", {
                    "code": code,
                    "type": "yandex_money",
                    "streamer": "yes"
                },
                function(data) {
                    console.log(data)
                    localStorage.setItem('Token', data.pass)
                    localStorage.setItem('ym_token', data.access_token)
                    localStorage.setItem('id', data.id)
                     $.ajax({
                        url: 'https://money.yandex.ru/api/account-info',
                        type: 'POST',
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + encodeURIComponent(data.access_token));
                            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        },
                        success: function(response) {
                            authWindow.destroy()
                            storage.set('auth', true, function(error) {
                                if (error) console.log(error);
                            });
                            ipcRenderer.send('show-main-from-auto')
                        },
                        error: function(error) {
                            console.log(JSON.parse(error.responseText));
                        }
                });
            });
        }
        });

        authWindow.loadURL(authUrl);

    }

    registration.onclick = () => {
        shell.openExternal('https://money.yandex.ru/new')
    }

    exit.onclick = () => {
        remote.app.quit()
    }
}
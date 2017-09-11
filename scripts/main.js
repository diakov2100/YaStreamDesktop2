import React from 'react';
import ReactDOM from 'react-dom';
import MainMain from '../views/main/mainMain.jsx';

const { ipcRenderer } = require('electron')
const remote = require('electron').remote
const storage = require('electron-json-storage');
const fs = require('fs')
const $ = require('./jquery.js')

var yandex = new yandexAPI.apiRequests()
var yastream = new yastreamAPI.apiRequests()
var twitch = new twitchAPI.apiRequests()
var qiwi = new qiwiAPI.apiRequests()

window.onload = function() {
    if (localStorage.ym_token) {
        $.ajax({
            url: 'https://money.yandex.ru/api/account-info',
            type: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + encodeURIComponent(localStorage.ym_token));
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            },
            success: function(response) {
                console.log(response.balance)
                localStorage.setItem('ya_account', response.account)
                localStorage.setItem('ya_balance', response.balance)
            },
            error: function(error) {
                console.log(error);
                relogin();
            }
        })
    }

   
    if (localStorage.qiwi_token) {
        qiwi.getBalance(false, function(data, error){
            if(data===null){
               relogin();
            }
            else {
                console.log(data);
                var sum=0;
                for (var i = 0; i < data.length; i++){
                    if (data[i].hasBalance == true){
                       sum+=balance;
                    }
                }
                localStorage.setItem('qiwi_balance', sum)
            }
        })
    }

    yastream.getUserInfo(false, function(data, error){
            if(data===null){
               relogin();
            }
    })
     yastream.getLiveStream(false, function(data, error){
            if(data===null){
               localStorage.setItem('liveStream', false)
            }
            else {
                data.start_date=data.start_date.replace('T', ' ')
                localStorage.setItem('liveStream_name', data.name)
                localStorage.setItem('liveStream_id', data.stream_id)
                localStorage.setItem('liveStream_url', data.url)
                localStorage.setItem('liveStream_channel', data.channel)
                localStorage.setItem('liveStream_startdate', data.start_date)
                localStorage.setItem('liveStream', true)
            }
    })
    if (localStorage.qiwi_token && !localStorage.ym_token) {
        ReactDOM.render(<MainMain stream={localStorage.liveStream} ya_balance={'подключите Я.Д'} qiwi_balance={'QIWI: ' + localStorage.qiwi_balance + 'руб.'} />, document.getElementsByClassName('container')[0])
        document.getElementsByTagName('p')[1].onclick = () => {
            yandex.Authorization(yastream.addYMAuth)
        }
    }
    if (!localStorage.qiwi_token && localStorage.ym_token) {
        ReactDOM.render(<MainMain stream={localStorage.liveStream} ya_balance={'Я.Д: ' + localStorage.ya_balance + 'руб.'} qiwi_balance={'подключите QIWI'} />, document.getElementsByClassName('container')[0])
        document.getElementsByTagName('p')[2].onclick = () => {
            qiwi.Authorization(yastream.addQIWIAuth)
        }
    }
    if (localStorage.qiwi_token && localStorage.ym_token) {
    ReactDOM.render(<MainMain stream={localStorage.liveStream} ya_balance={'Я.Д: ' + localStorage.ya_balance + 'руб.'} qiwi_balance={'QIWI: ' + localStorage.qiwi_balance + 'руб.'} />, document.getElementsByClassName('container')[0])
    }

            let active = true

            let links = document.getElementsByTagName('li')

            let newStream = links.item(0)
            let history = links.item(1)
            let goals = links.item(2)
            let settings = links.item(3)
            let logout = links.item(4)

            remote.getCurrentWindow().on('show', () => {
                if (localStorage.liveStream == 'true') {
                    newStream.innerHTML = 'Текущий стрим'
                } else {
                    newStream.innerHTML = 'Новый стрим'
                }
            })

            newStream.onclick = () => {
                if (active) {
                    if (localStorage.liveStream == 'false') {
                        ipcRenderer.send('show-chooseSrc')
                    } else {
                        ipcRenderer.send('start-stream')
                    }
                }
            }

            history.onclick = () => {
                if (active) {
                    ipcRenderer.send('show-history')
                }
            }

            goals.onclick = () => {
                if (active) {
                    ipcRenderer.send('show-goals')
                }
            }

            settings.onclick = () => {
                if (active) {
                    active = ipcRenderer.sendSync('show-settings')
                }
            }

            logout.onclick = () => {
                remote.app.quit()
            }

            ipcRenderer.on('settings-closed', (event, arg) => {
                active = arg
            })
        }

function relogin() {
                localStorage.clear()
                storage.clear(function(error) {
                    if (error) throw error;
                    ipcRenderer.send('show-auto-from-settings')
                })
}
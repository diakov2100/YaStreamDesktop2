

import React from 'react'
import ReactDOM from 'react-dom'
import Header from '../views/player/header.jsx'
import PlayerMain from '../views/player/playerMain.jsx'

let full = true
let donats
let current = 0
let total = 0.0
let checker = false
let sett = false
let settings = null

let qiwi_nextTxnDate
let qiwi_nextTxnId
let qiwi_donats =[]

let ym_donats =[]
let ym_lastRequest

const $ = require('./jquery.js')
const remote = require('electron').remote
const { Tray } = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const { ipcRenderer } = require('electron')
const moment = require('moment')

var yandex = new yandexAPI.apiRequests()
var yastream = new yastreamAPI.apiRequests()
var qiwi = new qiwiAPI.apiRequests()

$.ajax({
    url: 'http://streambeta.azurewebsites.net/api/donations/GetAllDonations?type=streamer&id=' + localStorage.id + '&stream_id=' + localStorage.liveStream_id,
    type: 'GET',
    async: false,
    beforeSend: function (xhr) {
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Token', localStorage.Token)
    },
    success: function (data) {
        if (data.length == 0) {
            donats = false
        }
        if (data.length > 0) {
            data.forEach(function (item) {
                if (item.status == 'approved') {
                    donats.push(item)
                    total = Math.round(item.amount + total * 100) / Math.pow(10, 2);
                }
            })
        }
    },
    error: function (error) {
        console.log(error)
    }
})

window.onload = function () {
    ipcRenderer.on('settingsClosed', () => {
        sett = false
        document.getElementsByClassName('settings')[0].childNodes[0].src = '../images/settingsdark.png'
    })
    ipcRenderer.send('inStream')
    ReactDOM.render(<Header total={total} name={localStorage.streamName} />, document.getElementsByClassName('header')[0])
    ReactDOM.render(<PlayerMain full={full} donats={donats} />, document.getElementsByClassName('main')[0])
    let tray = new Tray(__dirname + '/../images/turn-off.png')
    tray.on('click', () => {
        tray.destroy()
        ipcRenderer.send('end-stream')
    })

    document.getElementsByClassName('header-right')[0].childNodes[0].onclick = () => {
        if (full) {
            document.getElementsByClassName('header-right')[0].childNodes[0].src = '../images/hamb.png'
            full = false
            ReactDOM.render(<PlayerMain full={full} donat={donats[current]} />, document.getElementsByClassName('main')[0])
        } else {
            document.getElementsByClassName('header-right')[0].childNodes[0].src = '../images/hambActive.png'
            full = true
            ReactDOM.render(<PlayerMain full={full} donats={donats} />, document.getElementsByClassName('main')[0])
        }
    }

    document.getElementsByClassName('settings')[0].childNodes[0].onclick = () => {
        if (sett) {
            sett = false
            ipcRenderer.send('close-inStream-settings')
            document.getElementsByClassName('settings')[0].childNodes[0].src = '../images/settingsdark.png'
        } else {
            sett = true
            ipcRenderer.send('show-inStream-settings')
            document.getElementsByClassName('settings')[0].childNodes[0].src = '../images/settings.png'
        }
        ipcRenderer.send('show')
    }

    $(document).on('click', '.next', function () {
        current++
        if (current == donats.length) {
            current = 0
        }
        ReactDOM.render(<PlayerMain full={full} donat={donats[current]} />, document.getElementsByClassName('main')[0])
    })

    $(document).on('click', '.reply', function () {
        let textArea = this.parentElement.parentElement.parentElement.childNodes[2]
        let text = textArea.value
        if (!(this.classList.contains('replied')) && text) {
            let id = this.classList[0]
            this.classList.add('replied')
            textArea.disabled = true
            this.style.cursor = 'default'
            let doneIcon = this.parentElement.childNodes[1].childNodes[0]
            doneIcon.src = '../images/doneYellow.png'

            donats.forEach((item) => {
                if (item.operation_id == id) {
                    item.answer = text
                    $.ajax({
                        url: 'http://streambeta.azurewebsites.net/api/donations',
                        type: 'PUT',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Content-Type', 'application/json')
                            xhr.setRequestHeader('Token', localStorage.Token)
                        },
                        data: JSON.stringify(item),
                        success: function (response) {
                            console.log(response)
                        }
                    })
                }
            })
        }
    })
    if (localStorage.ym_token) {
        checkYM();
    }
    if (localStorage.qiwi_token) {
        checkYM();
    }
    var socket
    var st2 = "ws://streambeta.azurewebsites.net/DonationHandler.ashx";

    if (typeof (WebSocket) !== 'undefined') {
        socket = new WebSocket(st2);
    } else {
        socket = new MozWebSocket(st2);
    }
    socket.onopen = function () {
        socket.send('{ "account" : "' + localStorage.id+ '", "token": "' + localStorage.Token + '"}');
    };

    socket.onmessage = function (event, msg) {
        if (!checker) {
            checker = true
        } else {
            var donation = JSON.parse(event.data)
            console.log(event.data)
            if (donation.operation_id.indexOf("qw") >= 0) {
                qiwi_donats.push(donation)
            }
            else if (donation.operation_id.indexOf("ym") >= 0) {
                ym_donats.push(donation)
                yandex.checkOperationByID(donation.operation_id.substr(2), true,
                    (data, error) => {
                        if (data) {
                            findDonationByID(data.operation_id, showDonation)
                        }
                    }
                )
            }
            else {
                ym_donats.push(donation)
                console.log(donation)
                yandex.checkOperationByLable(donation.operation_id, false,
                    function(data, error){
                        console.log(data)
                        if (data) {
                            findDonationByID(data.operations[0].operation_id, showDonation)
                        }
                    }
                )
            }
        }
        if (!donats) {
            donats = []
        }
    }
    ipcRenderer.send('settings-window', sett)
    socket.onclose = function (event) {
        console.log('ws is closed')
    };
}



remote.getCurrentWindow().on('closed', () => {
    localStorage.removeItem('streamName')
})

function checkYM() {
    if (!ym_lastRequest)
        ym_lastRequest = String(moment(localStorage.liveStream_startdate).format("YYYY-MM-DDTHH:mm:ss"))+'Z'
    console.log(localStorage.liveStream_startdate)
    yandex.getOperationsWithLable(ym_lastRequest, true,
        function (data, error) {
            console.log('checkYM', data)
            if (data.operations) {
                function check(id) {
                    ym_donats.forEach(function (item){
                        if (item.operation_id==id) {
                            return true
                        }
                    })
                    return false
                }
                data.operations.forEach(function (item) {
                    if (item.label!='yms' && !check(item.label.substr(2)))
                        yastream.approveDonation(item.operation_id)
                })
            }
        }
    )
    ym_lastRequest =String(moment().format("YYYY-MM-DDTHH:mm:ss")) +'Z'
    setTimeout(checkYM, 40000);
};

function checkQIWI() {
    if (!qiwi_nextTxnId&&!qiwi_nextTxnDate) {
        qiwi.getOperationsFromDate(localStorage.liveStream_startdate, moment().format(), true, function(data, error){
            console.log(data);
            if (data.data){
                processQIWIData(data)
            }
        })
    }
    else {
        qiwi.getOperationsFromID( qiwi_nextTxnDate, qiwi_nextTxnId, true, function(data, error){
                console.log(data);
            if (data.data){
                processQIWIData(data)
            }
        })
    }
    setTimeout(checkQIWI, 40050);
};

function processQIWIData (data) {
                qiwi_nextTxnId=data.nextTxnId
                qiwi_nextTxnDate=data.nextTxnDate
                function find(amount) {
                    qiwi_donats.forEach(function (item){
                        if (amount*100 >= item.amount*0.9 && amount*100 <= item.amount*1.1) {
                            return item
                        }
                    })
                    return false
                }
                data.data.forEach(function (item){
                    var res= find(item.sum.amount);
                    if(res!=false){
                        var index = qiwi_donats.indexOf(res);
                        if (index >= 0) {
                            qiwi_donats.splice( index, 1 );
                        }
                        showDonation(res)
                    }
                })
}

function findDonationByID(id, callback) {
    if (id.indexOf("ym") >= 0) {
        function check(donation) {
            if (donation.operation_id == 'ym' + id)
                return donation;
        }
        callback(ym_donats.find(check))
    }
    else {
        function check(donation) {
            if (donation.operation_id == id)
                return donation;
        }
        callback(ym_donats.find(check))
    }
}


function showDonation(donation) {
    total = Math.round(donation.amount + total * 100) / Math.pow(10, 2);
    donation.status = "showed"
    donation.date = moment().format('YYYY-MM-DD HH:mm:ss')

    yastream.updateDonation(donation, true, function (data, error) {
        if (!error) {
            ReactDOM.render(< Header total={total} name={localStorage.streamName} />, document.getElementsByClassName('header')[0])
            ReactDOM.render(< PlayerMain full={full} donats={donats} />, document.getElementsByClassName('main')[0])
            ipcRenderer.send('show-donation', donation)
            ipcRenderer.send('update-goal', donation.amount)
        }
    })
}
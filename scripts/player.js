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
let qiwi_lastRequest
let qiwi_donats = []

let ym_donats = []
let ym_lastRequest

const $ = require('./jquery.js')
const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const { ipcRenderer } = require('electron')
const moment = require('moment')

var yandex = new yandexAPI.apiRequests()
var yastream = new yastreamAPI.apiRequests()
var qiwi = new qiwiAPI.apiRequests()

$.ajax({
    url: 'https://www.yastream.win/api/donations/GetAllDonations?type=streamer&id=' + localStorage.id + '&stream_id=' + localStorage.liveStream_id,
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
            donats = []
            data.forEach(function (item) {
                if (item.status == 'approved' || item.status == 'showed') {
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
    console.log(localStorage.ym_token)
    ipcRenderer.on('settingsClosed', () => {
        sett = false
        document.getElementsByClassName('settings')[0].childNodes[0].src = '../images/settingsdark.png'
    })
    ipcRenderer.send('inStream')
    ReactDOM.render(<Header total={total} name={localStorage.streamName} />, document.getElementsByClassName('header')[0])
    ReactDOM.render(<PlayerMain full={full} donats={donats} />, document.getElementsByClassName('main')[0])

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
                        url: 'https://www.yastream.win/api/donations',
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
        checkQIWI();
    }
    var socket
    var st2 = "ws://www.yastream.win//DonationHandler.ashx";

    if (typeof (WebSocket) !== 'undefined') {
        socket = new WebSocket(st2);
    } else {
        socket = new MozWebSocket(st2);
    }
    socket.onopen = function () {
        socket.send('{ "account" : "' + localStorage.id + '", "token": "' + localStorage.Token + '"}');
    };

    socket.onmessage = function (event, msg) {
        if (!checker) {
            checker = true
        } else {
            var donation = JSON.parse(event.data)
            console.log(event.data)
            if (donation.operation_id.indexOf("qw") >= 0) {
                qiwi_donats.push(donation)
                localStorage.qiwi_donats = qiwi_donats;
                console.log(qiwi_donats)
            }
            else if (donation.operation_id.indexOf("ym") >= 0) {
                ym_donats.push(donation)
                localStorage.ym_donats = ym_donats;
                showDonation(donation);
                /*yandex.checkOperationByID(donation.operation_id.substr(2), true,
                    (data, error) => {
                        if (data) {
                            findDonationByID(data.operation_id, showDonation)
                        }
                    }
                )*/
            }
            else {
                ym_donats.push(donation)
                console.log(donation)
                yandex.checkOperationByLable(donation.operation_id, false,
                    function (data, error) {
                        console.log(data)
                        if (data) {
                            findDonationByID(data.operations[0].label.substr(3), showDonation)
                        }
                    }
                )
            }
        }

    }
    /*
    if (localStorage.ym_donats) {
        ym_donats = localStorage.ym_donats;
    }
    else {
        ym_donats = []
    }

    if (localStorage.qiwi_donats) {
        qiwi_donats = localStorage.qiwi_donats;
    }
    else {
        qiwi_donats = []
    }
*/
    if (localStorage.qiwi_lastRequest) {
        qiwi_lastRequest = localStorage.qiwi_lastRequest
    }

    if (!donats) {
        donats = []
    }
    ipcRenderer.send('settings-window', sett)
    socket.onclose = function (event) {
        console.log('ws is closed')
    };




remote.getCurrentWindow().on('closed', () => {
    localStorage.removeItem('streamName')
})

function checkYM() {
    if (!ym_lastRequest)
        ym_lastRequest = String(moment(localStorage.liveStream_startdate).format("YYYY-MM-DDTHH:mm:ssZ"))
    console.log(ym_lastRequest)
    yandex.getOperationsWithLable(ym_lastRequest, true,
        function (data, error) {
            console.log('checkYM', data)
            if (data.operations) {
                function check(id) {
                    ym_donats.forEach(function (item) {
                        if (item.operation_id == id) {
                            return true
                        }
                    })
                    return false
                }
                data.operations.forEach(function (item) {
                    if (item.label && item.label != 'yms' && item.label.length > 3 && (!check(item.label.substr(3))))
                        yastream.approveDonation(item.label.substr(3))
                })
            }
        }
    )
    ym_lastRequest = String(moment().format("YYYY-MM-DDTHH:mm:ssZ"))
    setTimeout(checkYM, 15000);
};

function checkQIWI() {
    if (!qiwi_lastRequest) {
        var buf = String(moment().utc().format("YYYY-MM-DDTHH:mm:ss"));
        qiwi.getOperationsFromDate(moment(localStorage.liveStream_startdate).utc().format("YYYY-MM-DDTHH:mm:ss"), buf, true, function (data, error) {
            qiwi_lastRequest = buf;
            localStorage.qiwi_lastRequest = qiwi_lastRequest;
            console.log('qw_data', data);
            if (data.data !== null) {
                processQIWIData(data)
            }
        })
    }
    else {
        var buf = String(moment().utc().format("YYYY-MM-DDTHH:mm:ss"));
        qiwi.getOperationsFromDate(qiwi_lastRequest, buf, true, function (data, error) {
            qiwi_lastRequest = buf;
            localStorage.qiwi_lastRequest = qiwi_lastRequest;
            console.log('qw_data', data);
            if (data.data !== null) {
                processQIWIData(data)
            }
        })
    }
    setTimeout(checkQIWI, 15050);
};

function processQIWIData(QIWIdata) {
    console.log('qiwi_donats', qiwi_donats)
    var current;
    function find(item) {
        console.log(current, item)
        if (((current.sum.amount + current.commission.amount) * 100 == item.amount) && (item.text_data.includes(current.comment))) {
            return item
        }
    }
    QIWIdata.data.reverse().forEach(function (item) {
        current = item;
        var res = qiwi_donats.find(find);
        console.log('qiwi_res', res)
        if (res) {
            var index = qiwi_donats.indexOf(res);
            qiwi_donats.splice(index, 1);
            showDonation(res)
        }
    })
    localStorage.qiwi_donats = qiwi_donats;
}

function findDonationByID(id, callback) {
    console.log(id)
    console.log(ym_donats)
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
        var res = ym_donats.find(check)
        console.log(res)
        callback(res)
    }
}


function showDonation(donation) {
    total = Math.round(donation.amount + total * 100) / Math.pow(10, 2);
    donation.status = "showed"
    donation.date = moment().format('YYYY-MM-DD HH:mm:ss')
    donats.push(donation)
    console.log(donation)
    yastream.updateDonation(donation, true, function (data, error) {
        console.log(donation, data, error);
        if (!error) {
            ReactDOM.render(< Header total={total} name={localStorage.streamName} />, document.getElementsByClassName('header')[0])
            ReactDOM.render(< PlayerMain full={full} donats={donats} />, document.getElementsByClassName('main')[0])
            console.log(donation)
            ipcRenderer.send('show-donation', donation)
            ipcRenderer.send('update-goal', donation.amount)
        }
    })
}
}
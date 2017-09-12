var qiwiAPI = (function() {
    var tokenName = 'qiwi_token';
    var apiUrl = 'https://edge.qiwi.com/';

    const { ipcRenderer } = require('electron')
    const remote = require('electron').remote
    const BrowserWindow = remote.BrowserWindow
    const { shell } = require('electron')
    const path = require('path')
    const url = require('url')
    const storage = require('electron-json-storage');

    var api = {
        apiRequests: function() {}
    };

    /* api.apiRequests.prototype.getToken = function(callback) {
        tokenFetcher.getToken(tokenName, clientId, clientSecret, scope, authUrl, authUrl, callback);
    }
*/
     api.apiRequests.prototype.getUserInfo = function(async, callback) {
        xhrWithAuth('GET',
            apiUrl + 'person-profile/v1/profile/current',
            null,
            async,
            callback);
    }
    api.apiRequests.prototype.getBalance = function(async, callback) {
        xhrWithAuth('GET',
            apiUrl + 'funding-sources/v1/accounts/current',
            null,
            async,
            callback);
    }
    api.apiRequests.prototype.Authorization = function(callback) {
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
                callback(localStorage.qiwi_token);
            }
        })
        authWindow.once('ready-to-show', () => {
            authWindow.show()
        })
    }
    /*
        api.apiRequests.prototype.checkauth = function(callback) {
            chrome.storage.sync.get(tokenName, function(items) {
                if (!items[tokenName]) {
                    console.log(items, items[tokenName]);
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }

        api.apiRequests.prototype.getUserInfo = function(callback) {
            xhrWithAuth('POST',
                apiUrl + '/account-info',
                null,
                callback);
        };

        api.apiRequests.prototype.getUserOperations = function(lastRequestTime, callback) {
            xhrWithAuth('POST',
                apiUrl + '/operation-history',
                'type=deposition&from=' + lastRequestTime,
                callback);
        };

        api.apiRequests.prototype.getOperationDetails = function(operation_id, callback) {
            xhrWithAuth('POST',
                apiUrl + '/operation-details',
                'operation_id=' + operation_id,
                callback);
        };
    */
    return api;

    function onInfoFetched(error, status, response, callback) {
        if (!error && status == 200) {
            console.log(response);
            var data= null;
            if (response) {
                data = JSON.parse(response);
            }
            callback(data);
        } else {
            console.log('infoFetch failed', error, status);
            callback(null, status);
        }
    }

    function xhrWithAuth(method, url, async, params, callback) {
        var retry = true;
        getToken();

        function getToken() {
            if (!localStorage.qiwi_token) {
                //auth
            } else {
                requestStart();
            }
        }

        function requestStart() {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.qiwi_token);
            xhr.onload = requestComplete;
            xhr.send(params);
        }

        function requestComplete() {
            onInfoFetched(null, this.status, this.response, callback);
        }
    }
})();
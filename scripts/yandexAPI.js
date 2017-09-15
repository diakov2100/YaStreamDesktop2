var yandexAPI = (function() {
    var tokenName = 'yandex_token';
    var clientId = '880A4ADB0EEA4DABAA6B65ECCB91B71A47EBBFD54F129B7A47CC65D0322FD7B6';
    var scope = ['account-info', 'operation-history', 'operation-details'];
    var redirect_url = 'https://bkjjipopfjknbeabnlelfhplklgjfcaf.chromiumapp.org';
    var authUrl = 'https://money.yandex.ru/oauth';
    var apiUrl = 'https://money.yandex.ru/api';

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
    api.apiRequests.prototype.revokeToken = function(async) {
        xhrWithAuth('POST',
            apiUrl + '/revoke',
            async,
            null,
            (data, error) => { console.log(data) });
    }
    api.apiRequests.prototype.checkOperationByID = function(id, async, callback) {
        var params = JSON.stringify( {
                    operation_id: id
        });
        console.log(id)
        xhrWithAuth('POST',
            apiUrl + '/operation-details',
            async,
            encodeURIComponent('operation_id=' + id),
            callback);
    }
    api.apiRequests.prototype.checkOperationByLable = function(lable, async, callback) {
        var params = JSON.stringify( {
                    operation_id: lable
        });
        console.log(lable)
        xhrWithAuth('POST',
            apiUrl + '/operation-history',
            async,
            'label=' + 'yms' + lable,
            callback);
    }
    api.apiRequests.prototype.getOperationsWithLable = function(startDate, async, callback) {
        xhrWithAuth('POST',
            apiUrl + '/operation-history',
            async,
            'from=' + encodeURIComponent(startDate),
            callback);
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
        api.apiRequests.prototype.Authorization = function(callback) {
            
            var _authUrl = authUrl + '/authorize?client_id=' + clientId +
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
                    authWindow.destroy()
                    callback(code);
                }
            });

            authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {    
                let code = newUrl.split('=')[1]
                console.log(code)
                if (newUrl.includes(redirect_url)){
                    authWindow.destroy()
                    callback(code);
                }
            });

        authWindow.loadURL(_authUrl);

    }
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
            callback(null, new error('infoFetch failed'));
        }
    }

    function xhrWithAuth(method, url, async, params, callback) {
        var retry = true;
        getToken();

        function getToken() {
            if (!localStorage.ym_token) {
                //auth
            } else {
                requestStart();
            }
        }

        function requestStart() {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.ym_token);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = requestComplete;
            xhr.send(params);
        }

        function requestComplete() {
            if ((this.status < 200 || this.status >= 300) && retry) {
                retry = false;
                console.log('request failed');
            } else {
                console.log('request complete');
                onInfoFetched(null, this.status, this.response, callback);
            }
        }
    }
})();
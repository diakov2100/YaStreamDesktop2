var yastreamAPI = (function() {
    var tokenName = 'yastream_token';
    var apiUrl = 'http://streambeta.azurewebsites.net/api/';
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
    api.apiRequests.prototype.SearchOnlineStream_url = function(url, async, callback) {
        xhrWithAuth('GET',
            apiUrl + 'Streams?url='+url,
            async,
            null,
            callback);
    }
     api.apiRequests.prototype.getUserInfo = function(async, callback) {
        xhrWithAuth('GET',
            apiUrl + 'Streamers?account=' + localStorage.id,
            async,
            null,
            callback);
    }
    api.apiRequests.prototype.qiwiAuth = function(code, callback) {
       $.post("http://streambeta.azurewebsites.net/api/oauth", {
                    "code": code,
                    "type": "qiwi",
                    "streamer": "yes"
                },
                function(data) {
                    console.log(data)
                    localStorage.setItem('Token', data.pass)
                    localStorage.setItem('qiwi_token', data.code)
                    localStorage.setItem('id', data.id)
                    callback();
                });
    }
    api.apiRequests.prototype.ymAuth = function(code, callback) {

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
                    callback();
        });
    }
    api.apiRequests.prototype.addYMAuth = function(code) {
        var params = JSON.stringify( {
                    code: code,
                    type: 'yandex_money',
                    streamer: 'yes'
        });
        xhrWithAuth('PUT',
            apiUrl + 'oauth?id='+ localStorage.id,
            false,
            params,
            function(data, error) {
                if (data!=null){
                    console.log(data)
                    localStorage.setItem('ym_token', data.access_token)
                    ipcRenderer.send('reload-main')
                }
                console.log(error)
            });
    }
    api.apiRequests.prototype.addQIWIAuth = function(code) {
        var params = JSON.stringify( {
                    code: code,
                    type: 'qiwi'
        });
        xhrWithAuth('PUT',
            apiUrl + 'oauth?id='+ localStorage.id,
            false,
            params,
            function(data, error) {
                if (data!=null){
                    ipcRenderer.send('reload-main')
                }
                console.log(error)
            });
    }


    api.apiRequests.prototype.getLiveStream = function(async, callback) {
        xhrWithAuth('GET',
            apiUrl + 'Streams_online?streamer_id=' + localStorage.id,
            null,
            async,
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
            if (!localStorage.Token) {
                //auth
            } else {
                requestStart();
            }
        }

        function requestStart() {
            var xhr = new XMLHttpRequest();
            console.log('3')
            xhr.open(method, url, async);
            xhr.setRequestHeader('Token',  localStorage.Token);
            xhr.setRequestHeader('Content-Type',  'application/json');
            xhr.onload = requestComplete;
            xhr.send(params);
        }

        function requestComplete() {
            onInfoFetched(null, this.status, this.response, callback);
        }
    }
})();
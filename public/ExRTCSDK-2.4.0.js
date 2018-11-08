function ExRTC(){
    var publisherStream;
    var token;
    var OV;
    var session;
    var publisher;
    var onListeners = new Array();
    var userId;
    var userName;
    var mediaStream = false;
    var channel;
    var streamCreateTimeMap = new HashMap();
    var _this=this;

    this.join = function(channel,uid,userName,onSuccess,onFailure){
        _this.channel = channel;
        _this.httpPostRequest(
            'api-login/login',
            {userId:uid,userName:userName},
            'Login WRONG',
            (response) => {
                _this.innerJoin(channel,uid,userName,onSuccess,onFailure);
            }
        );
    }

    this.innerJoin = function(channel,uid,userName,onSuccess,onFailure){
        _this.httpPostRequest(
            'api-sessions/get-token',
            {sessionName: channel},
            'Request of TOKEN gone WRONG:',
            (response) => {
                _this.token = response[0];
                _this.OV = new OpenVidu();

                _this.session = _this.OV.initSession();

                _this.session.on('streamCreated', (event) => {
                    var stream = event.stream;
                    if(stream == undefined){
                        return;
                    }
                    var serverData = JSON.parse(stream.connection.data.split('%/%')[0]).clientUser;
                    var user = {userId:serverData.userId,userName:serverData.userName};

                    streamCreateTimeMap.put(user.userId,new Date().getTime());

                    if(user.userId == _this.userId){
                        return;
                    }
                    var exrtcStream = new ExRTCStream();
                    var params = {};
                    params.id = user.userId;
                    params.openviduStream = event.stream;
                    params.user = user;
                    exrtcStream.init(params);
                    var evt = {stream:exrtcStream,user:user};
                    _this.emit('stream-added',evt);
                });

                _this.session.on('streamPropertyChanged', (event) => {
                    console.log(event);
                });

                _this.session.on('streamDestroyed', (event) => {

                    var reason = event.reason;

                    var serverData = JSON.parse(event.stream.connection.data.split('%/%')[1]).serverData;

                    var user = {userId:serverData.userId,userName:serverData.userName};

                    var removeNow = true;

                    if(reason == 'networkDisconnect'){
                        var preCreateTime = streamCreateTimeMap.get(user.userId);
                        if(preCreateTime && (new Date().getTime() - preCreateTime) <= 1000*15){
                            removeNow = false;
                        }
                    }

                    if(removeNow){
                        var exrtcStream = new ExRTCStream();
                        var params = {};
                        params.id = user.userId;
                        params.openviduStream = event.stream;
                        params.user = user;
                        exrtcStream.init(params);
                        var evt = {stream:exrtcStream,user:{userId:serverData.userId,userName:serverData.userName}};

                        _this.emit('stream-removed',evt);

                        streamCreateTimeMap.remove(user.userId);
                    }

                });

                //链接恢复后的回调
                _this.session.on('connectionRecovered', (event) => {
                    console.log("connectionRecovered  rejoinRoom ....");
                    _this.session.disconnect();
                    _this.session = false;
                    _this.OV = false;
                    _this.publisher = false;
                    _this.token =false;
                    _this.innerJoin(_this.channel,_this.userId,_this.userName,onSuccess,onFailure);
                });

                _this.userId = uid;
                _this.userName = userName;
                _this.session.connect(_this.token, { clientData: _this.userId ,clientUser:{userId:_this.userId,userName:_this.userName}})
                    .then(() => {
                        if(_this.mediaStream){
                            $("#"+_this.mediaStream.elmentId).find("video").remove();
                            _this.publish(_this.mediaStream,_this.mediaStream.elmentId);
                        }else{
                            onSuccess();
                        }
                    })
                    .catch(error => {
                        if(!_this.mediaStream){
                            console.error('There was an error connecting to the session:', error.code, error.message);
                            onFailure();
                        }
                    });
            }
        );
    }

    this.subscribe = function(rtcStream,elementId){
        var subscriber = _this.session.subscribe(rtcStream.openviduStream, elementId);
        subscriber.on('videoElementCreated', (event) => {
            setTimeout(function(){
                var user = rtcStream.user;
                var exrtcStream = new ExRTCStream();
                var params = {};
                params.id = rtcStream.user.userId;
                params.subscriber = subscriber;
                params.openviduStream = rtcStream.openviduStream;
                params.videoElement = event.element;
                params.user = user;
                exrtcStream.init(params);
                var evt = {stream:exrtcStream,user:user};
                console.log(evt);
                _this.emit('stream-subscribed',evt);
            },500);
        });
    }

    this.leave = function(){
        _this.session.disconnect();
        _this.session.leave(false,"");
        _this.session = null;
    }

    this.publish = function(mediaStream,elmentId){
        mediaStream.elmentId = elmentId;
        _this.mediaStream = mediaStream;
        var videoSource = mediaStream.getVideoTracks()[0];
        var audioSource = mediaStream.getAudioTracks()[0];
        _this.publisher = _this.OV.initPublisher(elmentId, {
            audioSource: audioSource, // The source of audio. If undefined default microphone
            videoSource: videoSource, // The source of video. If undefined default webcam
            publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
            publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
            resolution: '640x480',  // The resolution of your video
            frameRate: 30,			// The frame rate of your video
            insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
            mirror: false       	// Whether to mirror your local video or not
        });
        _this.publisher.on('videoElementCreated', (event) => {
            console.log("videoElementCreated....");

            var user = {userId:_this.userId,userName:_this.userName};

            var exrtcStream = new ExRTCStream();
            var params = {};
            params.id = _this.userId;
            params.publisher = _this.publisher;
            params.openviduStream=event.target.stream;
            params.user = user;
            params.videoElement = event.element;
            exrtcStream.init(params);

            _this.emit("stream-published",{stream:exrtcStream,user:user});
        });
        _this.session.publish(_this.publisher);
    }

    this.unpublish = function(rtcStream){
        _this.mediaStream = false;
        _this.session.unpublish(_this.publisher);
        _this.emit("stream-removed",{stream:rtcStream,user:rtcStream.user});
    }

    this.on = function(type,callback){
        var eventBean = {type:type,callback:callback};
        onListeners.push(eventBean);
    }
    this.emit = function(type,event){
        onListeners.forEach(function (bean) {
            var beanType = bean.type;
            var callback = bean.callback;
            if(beanType == type){
                callback(event);
                return;
            }
        });
    }

    this.removeUser = function () {
        _this.httpPostRequest(
            'api-sessions/remove-user',
            {sessionName: _this.channel, token: _this.token},
            'User couldn\'t be removed from session',
            (response) => {
                console.warn("You have been removed from session " + _this.channel);
            }
        );
    }

    this.logOut = function(){
        _this.httpPostRequest(
            'api-login/logout',
            {},
            'Logout WRONG',
            (response) => {
                $("#not-logged").show();
                $("#logged").hide();
            }
        );
    }

    this.httpPostRequest = function(url, body, errorMsg, callback) {
        var protocal = window.location.protocol;
        var host = window.location.host;
        if(host.indexOf("maaee.com") != -1){
            url = "openvidu/"+url;
        }
        url = protocal+"//"+host+"/"+url;
        var http = new XMLHttpRequest();
        http.open('POST', url, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.addEventListener('readystatechange', processRequest, false);
        http.send(JSON.stringify(body));

        function processRequest() {
            if (http.readyState == 4) {
                if (http.status == 200) {
                    try {
                        callback(JSON.parse(http.responseText));
                    } catch (e) {
                        callback();
                    }
                } else {
                    console.warn(errorMsg);
                    console.warn(http.responseText);
                }
            }
        }
    }


    window.onbeforeunload = function(e){
        if(_this.session){
           _this.session.disconnect();
        }
        e.returnValue = false;
    }

    window.addEventListener('beforeunload', function(){
        if(_this.session){
            _this.session.disconnect();
        }
        e.returnValue = false;
    });
}

function ExRTCStream(){
    var id;
    var subscriber;
    var publisher;
    var openviduStream;
    var user;
    var videoElement;
    var _this = this;

    this.init = function(params){
        if(params.id){
            _this.id = params.id;
        }
        if(params.subscriber){
            _this.subscriber = params.subscriber;
        }
        if(params.publisher){
            _this.publisher = params.publisher;
        }
        if(params.openviduStream){
            _this.openviduStream = params.openviduStream;
        }
        if(params.user){
            _this.user = params.user;
        }
        if(params.videoElement){
            _this.videoElement = params.videoElement;
        }
    }

    this.getId = function(){
        return _this.id;
    }

    this.enableAudio = function(){
        if(_this.subscriber){
            try{
                _this.subscriber.subscribeToAudio(true);
            }catch (e){
                console.error(e);
            }
        }
        if(_this.publisher){
            try{
                _this.publisher.publishAudio(true);
            }catch (e){
                console.error(e);
            }
        }
    }

    this.disableAudio = function(){
        if(_this.subscriber){
            try{
                _this.subscriber.subscribeToAudio(false);
            }catch (e){
                console.error(e);
            }
        }
        if(_this.publisher){
            try{
                _this.publisher.publishAudio(false);
            }catch (e){
                console.error(e);
            }
        }
    }
    this.enableVideo = function(){
        if(_this.subscriber){
            try{
                _this.subscriber.subscribeToVideo(true);
            }catch (e){
                console.error(e);
            }
        }
        if(_this.publisher){
            try{
                _this.publisher.publishVideo(true);
            }catch (e){
                console.error(e);
            }
        }
    }
    this.disableVideo = function(){
        if(_this.subscriber){
            try{
                _this.subscriber.subscribeToVideo(false);
            }catch (e){
                console.error(e);
            }
        }
        if(_this.publisher){
            try{
                _this.publisher.publishVideo(false);
            }catch (e){
                console.error(e);
            }
        }
    }
}

function HashMap() {

    var mapObj = {};

    this.put = function (key, value) {
        mapObj[key] = value;
    };

    this.remove = function (key) {
        if (mapObj.hasOwnProperty(key)) {
            delete mapObj[key];
        }
    };

    this.get = function (key) {
        if (mapObj.hasOwnProperty(key)) {
            return mapObj[key];
        }
        return null;
    };

    this.keys = function () {
        var keys = [];
        for(var k in mapObj){
            keys.push(k);
        }
        return keys;
    };

    // 遍历map
    this.each = function(fn){
        for(var key in mapObj){
            fn(key, mapObj[key]);
        }
    };

    this.toString = function () {
        var str = "{";
        for(var k in mapObj){
            str += "\""+ k+"\" : \""+mapObj[k]+"\",";
        }
        str = str.substring(0,str.length - 1) ;
        str += "}";
        return str;
    };
}



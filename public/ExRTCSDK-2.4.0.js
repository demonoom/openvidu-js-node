function ExRTC(){
    var publisherStream;
    var token;
    var OV;
    var session;
    var publisher;
    var onListeners = new Array();
    var userId;
    var userName;
    var _this=this;

    this.join = function(channel,uid,userName,onSuccess,onFailure){
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
                    var serverData = JSON.parse(stream.connection.data.split('%/%')[1]).serverData;

                    $("#rtc_video_container #video_stream_"+serverData.userId).remove();
                    $("#rtc_video_container").append("<div id='video_stream_"+serverData.userId+"'><span>"+serverData.userName+"</span></div>");

                    var subscriber = _this.session.subscribe(event.stream, 'video_stream_'+serverData.userId);
                    subscriber.on('videoElementCreated', (event) => {
                        setTimeout(function(){
                            var evt = {videoElement:event.element,user:{userId:serverData.userId,userName:serverData.userName}};
                            console.log(evt);
                            _this.emit('stream-add',evt);
                        },500);
                    });
                });

                _this.session.on('streamPropertyChanged', (event) => {
                   console.log(event);
                });

                _this.session.on('streamDestroyed', (event) => {
                    var serverData = JSON.parse(event.stream.connection.data.split('%/%')[1]).serverData;

                    $("#rtc_video_container #video_stream_"+serverData.userId).remove();

                    var evt = {user:{userId:serverData.userId,userName:serverData.userName}};
                    _this.emit('stream-remove',evt);
                });

                _this.userId = uid;
                _this.userName = userName;
                _this.session.connect(_this.token, { clientData: _this.userId })
                    .then(() => {
                        onSuccess();
                    })
                    .catch(error => {
                        console.warn('There was an error connecting to the session:', error.code, error.message);
                        onFailure();
                    });
            }
        );
    }


    this.leave = function(){
        _this.session.disconnect();
        _this.session = null;
    }

    this.publish = function(mediaStream){
        $("#rtc_video_container #video_stream_"+_this.userId).remove();
        $("#rtc_video_container").append("<div id='video_stream_"+_this.userId+"'><span>"+_this.userName+"</span></div>");
        _this.publisher = _this.OV.initPublisher('video_stream_'+_this.userId, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
            publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
            resolution: '640x480',  // The resolution of your video
            frameRate: 30,			// The frame rate of your video
            insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
            mirror: false       	// Whether to mirror your local video or not
        });
        _this.publisher.on('videoElementCreated', (event) => {
            console.log("videoElementCreated....");
            _this.emit("stream-published",{videoElement:event.element,user:{userId:_this.userId,userName:_this.userName}});
        });
        _this.session.publish(_this.publisher);
    }

    this.unpublish = function(){
        _this.session.unpublish(_this.publisher);
        $("#rtc_video_container #video_stream_"+_this.userId).remove();
    }

    this.disableAudio = function(){
        _this.publisher.publishAudio(false);
    }

    this.enableAudio = function(){
        _this.publisher.publishAudio(true);
    }

    this.disableVieo = function(){
        _this.publisher.publishVideo(false);
    }

    this.enableVideo = function(){
        _this.publisher.publishVideo(true);
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
            {sessionName: sessionName, token: token},
            'User couldn\'t be removed from session',
            (response) => {
                console.warn("You have been removed from session " + sessionName);
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


    window.onbeforeunload = function(){
        if(_this.session){
            _this.removeUser();
            _this.leave();
            _this.logOut();
        }
    }
}



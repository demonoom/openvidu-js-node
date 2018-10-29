

var recording = false;
var mediaRecorder;
var socket = null;
var needAfterReconnectSendFirstFrame = false;
var chunks = new Array();
var needReconnect = true;
var pushUrl = "rtmp://60.205.86.217:19350/live4/119665";
var recodingImages = ['recordRTC-progress-1.png', 'recordRTC-progress-2.png', 'recordRTC-progress-3.png', 'recordRTC-progress-4.png', 'recordRTC-progress-5.png'];
var recodingImgIndex = 0;
var reverse = false;
var streams = new Array();
var reconnectCount = 0;
var recordingTipText;
var recordingTipImg;
const {desktopCapturer} = require('electron');


function stopCapture(){
    if(mediaRecorder){
        mediaRecorder.stop();
        mediaRecorder = null;
    }
    setBadgeText('点击开始推流');
    setBadgeImg('images/tabCapture22.png');
    recording = false;
    needReconnect = false;
    needAfterReconnectSendFirstFrame = false;
    if(socket){
        socket.disconnect();
    }
    chunks = new Array();

    try{
        streams.forEach(function(stream){
            stream.getTracks().forEach(function(track){
                track.stop();
            });
        });
    }catch (e){
    }

    setBadgeText("");

    streams = new Array();
    reconnectCount = 0;
}


function onRecording() {
    if(!recording){
        return;
    }
    setBadgeText("录制中...");

    setBadgeImg('images/' + recodingImages[recodingImgIndex]);

    if (!reverse) {
        recodingImgIndex++;

        if (recodingImgIndex > recodingImages.length - 1) {
            recodingImgIndex = recodingImages.length - 1;
            reverse = true;
        }
    } else {
        recodingImgIndex--;

        if (recodingImgIndex < 0) {
            recodingImgIndex = 1;
            reverse = false;
        }
    }

    if (recording) {
        setTimeout(onRecording, 800);
        return;
    }

    setBadgeImg("images/tabCapture22.png");
}

function setBadgeText(text) {
    $(recordingTipText).text(text);
}

function setBadgeImg(img){
    $(recordingTipImg).attr("src",img);
}

function captureTab(config) {

    pushUrl = config.pushUrl;
    recordingTipText = $("#"+config.recordingTipTextId);
    recordingTipImg = $("#"+config.recordingTipImgId);

    needReconnect = true;

    const constraints = {
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop'
            }
        },
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                maxWidth:config.maxWidth,
                minWidth:config.minWidth,
                maxHeight:config.maxHeight,
                minHeight:config.minHeight,
                maxFrameRate:config.maxFrameRate,
                minFrameRate:config.minFrameRate
            }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(tabStream){
            onTabStream(tabStream,config);
        })
        .catch(function(e){
            console.log(e);
        });
}

function onTabStream(tabStream,config){
    streams.push(tabStream);

    // var playAudioStream = new MediaStream();
    // tabStream.getAudioTracks().forEach(function(track) {
    //     playAudioStream.addTrack(track);
    // });
    // var audio = new Audio();
    // audio.srcObject = playAudioStream;
    // audio.play();

    navigator.mediaDevices.getUserMedia({audio:{mandatory:{echoCancellation: true}},video:false}).then(function(micStream) {


        var cts = {
            autoGainControl:true,//自动增益控制
            noiseSuppression:true,//噪声抑制
            echoCancellation:true//回声消除
        };

        var audioTracks = micStream.getAudioTracks();
        try{
            if(audioTracks && audioTracks.length && audioTracks.length > 0){
                var audioTrack = audioTracks[0];
                audioTrack.applyConstraints(cts);
            }
        }catch (e){

        }

        var speakers = new MediaStream();
        tabStream.getAudioTracks().forEach(function(track) {
            speakers.addTrack(track);
            tabStream.removeTrack(track);
        });

        streams.push(speakers);
        streams.push(micStream);

        var mixer = new MultiStreamsMixer([speakers, micStream]);
        mixer.getMixedStream().getAudioTracks().forEach(function(track) {
            tabStream.addTrack(track);
        });


        recording = true;
        onRecording();
        tabStream.onended = function() {
            stopCapture();
        };
        if (tabStream.getVideoTracks().length) {
            tabStream.getVideoTracks().forEach(function(track) {
                track.onended = function() {
                    tabStream.onended();
                };
            });
        }


        initSocket(config.webSocketUrl,function(){
            gotStream(tabStream,config.timeSlice);
        });

    }).catch(function(err) {
        console.log(err);
        stopCapture();
    });
}

function initSocket(webSocketUrl,callback){
    socket = io(webSocketUrl);
    socket.on('message',function(m){
        console.log('recv server message',m);
    });
    socket.on('fatal',function(m){
        console.log('ERROR: unexpected:'+m);
    });
    socket.on('ffmpeg_stderr',function(m){
        console.log('FFMPEG:'+m);
    });
    socket.on('disconnect', function () {
        console.log('disconnected from server !!');
        console.log('reconnect to server !!');
        socket.disconnect();
        socket = null;
        if(!needReconnect){
            return;
        }
        if(reconnectCount >=10){
            console.log("重连次数太多，停止重连...");
            stopCapture();
            return;
        }
        reconnectCount ++;
        setTimeout(function(){
            initSocket(webSocketUrl,function () {
                if(chunks.length > 0){
                    needAfterReconnectSendFirstFrame = true;
                    socket.emit('config_rtmpDestination',pushUrl);
                    socket.emit('start','start');
                }
            });
        },3000);
    });

    socket.on('connect', function () {
        if(callback){
            callback();
        }
    });

    socket.on('connect_failed', function() {
        socket.disconnect();
        socket = null;
        if(!needReconnect){
            return;
        }
        if(reconnectCount >=10){
            console.log("重连次数太多，停止重连...");
            stopCapture();
            return;
        }
        reconnectCount ++;
        setTimeout(function(){
            initSocket(webSocketUrl,function () {
                if(chunks.length > 0){
                    needAfterReconnectSendFirstFrame = true;
                    socket.emit('config_rtmpDestination',pushUrl);
                    socket.emit('start','start');
                }
            });
        },3000);
    });
}


function gotStream(stream,timeSlice) {

    if (!stream) {
        return;
    }

    setBadgeText('正在录制中...');

    socket.emit('config_rtmpDestination',pushUrl);
    socket.emit('start','start');


    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(timeSlice);

    mediaRecorder.ondataavailable = function(e) {

        if(chunks.length == 0){
            chunks.push(e.data);
        }
        if(socket == null || !socket.connected){
            return;
        }

        if(needAfterReconnectSendFirstFrame){
            socket.emit("binarystream",chunks[0]);
            needAfterReconnectSendFirstFrame = false;
        }else{
            socket.emit("binarystream",e.data);
        }
    }

}

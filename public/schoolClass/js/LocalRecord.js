var recording = false;
var mediaRecorder;
var recodingImages = ['recordRTC-progress-1.png', 'recordRTC-progress-2.png', 'recordRTC-progress-3.png', 'recordRTC-progress-4.png', 'recordRTC-progress-5.png'];
var recodingImgIndex = 0;
var streams = new Array();
var recordingTipText;
var recordingTipImg;
var reverse = false;
var electronRemote = require('electron').remote;
var electronFs = electronRemote.require('fs');
var electronFsPromises = electronRemote.require('fs').promises;
var clazzName = "";
var startTime ;
var teacherId;
var videoSize = 0;
var filePath;

function onRecording() {
    if(!recording){
        return;
    }
    setBadgeText("录屏中...");

    setBadgeImg('videoSource-menu3-2');

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
    setBadgeImg("videoSource-menu3-2");
}

function setBadgeText(text) {
}

function setBadgeImg(clazz){
}

function captureTab(config) {

    teacherId = config.teacherId;
    startTime = new Date().getTime();
    recordingTipText = $("#"+config.recordingTipTextId);
    recordingTipImg = $("#"+config.recordingTipImgId);

    clazzName = config.clazzName;

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

        gotStream(tabStream);

    }).catch(function(err) {
        console.log(err);
        stopCapture();
    });
}

function getDefaultVideoSavePath(){
    return "C:\\LittleAntTeachingRecord\\";
}

function gotStream(stream) {

    if (!stream) {
        return;
    }
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(1000 * 10);

    mediaRecorder.ondataavailable = function (e) {
        var streamData = e.data;
        videoSize = videoSize + streamData.size;
        var blob = new Blob([streamData], {'type': 'video/webm\\;codecs=vp9'});
        let reader = new FileReader();
        reader.onload = function () {
            var saveFolder = localStorage.getItem("video_save_folder");
            if (saveFolder == null || saveFolder == undefined || saveFolder == "") {
                saveFolder = getDefaultVideoSavePath();
            }
            saveFolder = saveFolder.replace(/\\/g, "\\\\") + "\\";

            electronFs.exists(saveFolder, function (exists) {
                if (!exists) {
                    electronFs.mkdir(saveFolder, function (error) {
                        if (error) {
                            console.log(error);
                            return false;
                        }
                        console.log('创建目录成功');
                        appendDataToDiskFile(saveFolder, reader);
                    })
                } else {
                    appendDataToDiskFile(saveFolder, reader);
                }
            })
        }
        reader.readAsArrayBuffer(blob);
    }
}

function appendDataToDiskFile(saveFolder,reader){
    if (reader.readyState == 2) {
        var buffer = Buffer.from(reader.result);
        var file = saveFolder+startTime+".mp4";
        filePath = file;
        electronFsPromises.appendFile(file, buffer);
    }
}

function stopCapture(){
    stopMediaRecorder();
    setBadgeText('服务端录屏');
    setBadgeImg('videoSource-menu3');
    recording = false;
    try{
        streams.forEach(function(stream){
            stream.getTracks().forEach(function(track){
                track.stop();
            });
        });
    }catch (e){
    }
    streams = new Array();
    $(".audioCanvas").remove();
}

function stopMediaRecorder(){
    if(mediaRecorder){
        $(recordingTipText).text("正在保存视频..");
        mediaRecorder.stop();
        mediaRecorder = null;
        setTimeout(function () {
            var savedVideoInfos = localStorage.getItem(teacherId+"_savedVideoInfos");
            if(savedVideoInfos == null || savedVideoInfos == undefined){
                savedVideoInfos = new Array();
            }else{
                savedVideoInfos = JSON.parse(savedVideoInfos);
            }
            var item = {};
            item.id = guid();
            item.clazzName = clazzName;
            item.createTime = startTime;
            item.filePath = filePath;
            item.fileName = startTime+".mp4";
            item.size = videoSize;
            savedVideoInfos.splice( 0, 0, item );
            localStorage.setItem(teacherId+"_savedVideoInfos",JSON.stringify(savedVideoInfos));
            //关闭录制窗口
            window.close();
        },1000);
    }
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


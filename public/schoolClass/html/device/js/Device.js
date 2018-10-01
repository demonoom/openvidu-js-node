/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

var videoElement = document.querySelector('video');
var audioInputSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');
var selectors = [audioInputSelect, videoSelect];


function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  var values = selectors.map(function(select) {
    return select.value;
  });
  selectors.forEach(function(select) {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label ||
          'microphone ' + (audioInputSelect.length + 1);
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach(function(select, selectorIndex) {
    if (Array.prototype.slice.call(select.childNodes).some(function(n) {
      return n.value === values[selectorIndex];
    })) {
      select.value = values[selectorIndex];
    }
  });
}


function gotStream(stream) {
  window.stream = stream; // make stream available to console
  var audioTracks = stream.getAudioTracks()[0];
  var videoTracks = stream.getVideoTracks()[0];
  var audioInputSelectOptions = $(audioInputSelect).find("option"); 
  for(var i =0;i<audioInputSelectOptions.length;i++){
	  var op = $(audioInputSelectOptions[i]);
	  if(op.text() == audioTracks.label){
		  op.attr("selected","selected");
	  }
  }
  
  var videoInputSelectOptions = $(videoSelect).find("option"); 
  for(var i =0;i<videoInputSelectOptions.length;i++){
	  var op = $(videoInputSelectOptions[i]);
	  if(op.text() == videoTracks.label){
		  op.attr("selected","selected");
	  }
  }
  
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function start(mediaCallback) {
  if (window.stream) {
      window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  
  navigator.mediaDevices.enumerateDevices().then(gotDevices);
  
  var audioSource = audioInputSelect.value;
  var videoSource = videoSelect.value;
  var constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).
  then(gotStream).then(gotDevices).then(function(){
	  if(mediaCallback){
		  audioSource = audioInputSelect.value;
		  videoSource = videoSelect.value;
		  mediaCallback.onMediaOK({"audioInputSource":audioSource,"videoSource":videoSource});
	  }
  }).catch(function(e){
	  handleError(e,mediaCallback);
	  var audioInputSelectOptions = $(audioInputSelect).find("option");
	  var videoInputSelectOptions = $(videoSelect).find("option");
	  if(audioInputSelectOptions.length == 0 && videoInputSelectOptions.length > 0){
		  var vicons = {
			  video: {deviceId: videoSource ? {exact: videoSource} : undefined}
		  };
		  navigator.mediaDevices.getUserMedia(vicons);
	  }else if(videoInputSelectOptions.length == 0 && audioInputSelectOptions.length > 0){
		  var aucons = {
			  audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
		  };
		  navigator.mediaDevices.getUserMedia(aucons);
	  }
  });
}

function handleError(error,mediaCallback) {
  if(mediaCallback){
	  mediaCallback.onMediaError(error);
  }
}

function getQueryString(name){
		var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if(r!=null) {
			return unescape(r[2]);
		}
		return null;
}

audioInputSelect.onchange = start;
videoSelect.onchange = start;

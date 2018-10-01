var client = new ExRTC();

function getQueryString(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null) {
        return unescape(r[2]);
    }
    return null;
}

var localStream;
var userId;
var userName;

function joinSession() {
	var channel = getQueryString("roomId");
    userName = getQueryString("userName");
    userId = getQueryString("userId");
	client.join(channel,userId,userName,function(){
        $('#join').hide();
        $('#session').show();
        if(userName == 'zhangsan'){
        	publish();
		}
	},function(){

	});
	client.on("stream-added",function(event){
		console.log(event);
		var stream = event.stream;

        $("#rtc_video_container #video_stream_"+stream.id).remove();
        $("#rtc_video_container").append("<div id='video_stream_"+stream.user.userId+"'><span>"+stream.user.userName+"</span></div>");

        client.subscribe(stream,"video_stream_"+stream.user.userId);
    });

    client.on("stream-subscribed",function(event){
        var stream = event.stream;
        initMainVideo(stream.videoElement, stream.user.userId,stream.user.userName);
        console.log(event);
    });

    client.on("stream-published",function(event){
        console.log(event);
        var stream = event.stream;
        localStream = stream;
        initMainVideo(stream.videoElement, stream.user.userId,stream.user.userName);
    });
	client.on("stream-removed",function(event){
        console.log(event);
        var stream = event.stream;
        $("#rtc_video_container #video_stream_"+stream.user.userId).remove();
	});
}

function publish(){
    $("#rtc_video_container #video_stream_"+userId).remove();
    $("#rtc_video_container").append("<div id='video_stream_"+userId+"'><span>"+userName+"</span></div>");
	client.publish(null,"video_stream_"+userId);
}

function unpublish() {
    client.unpublish(localStream);
}

function muteAudio(){
    client.disableAudio();
}

function unmuteAudio(){
    client.enableAudio();
}


function initMainVideo(videoElement, userId, userName) {
	$('#main-video video').get(0).srcObject = videoElement.srcObject;
	$('#main-video p.userName').html(userName);
	$('#main-video video').prop('muted', true);
}

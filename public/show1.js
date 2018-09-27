var client = new ExRTC();

function getQueryString(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null) {
        return unescape(r[2]);
    }
    return null;
}

function joinSession() {
	var channel = getQueryString("roomId");
	var userName = getQueryString("userName");
	var userId = getQueryString("userId");
	client.join(channel,userId,userName,function(){
        $('#join').hide();
        $('#session').show();
        if(userName == 'zhangsan'){
        	publish();
		}
	},function(){

	});
	client.on("stream-add",function(event){
		console.log(event);
        initMainVideo(event.videoElement, event.user.userId,event.user.userName);
    });
    client.on("stream-published",function(event){
        console.log(event);
        initMainVideo(event.videoElement, event.user.userId,event.user.userName);
    });
	client.on("stream-remove",function(event){
        console.log(event);
	});
}

function publish(){
	client.publish(null);
}

function unpublish() {
    client.unpublish();
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

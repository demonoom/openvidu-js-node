function SimpleConnection(){
	this.clazzWsListener = null;
	this.WS_URL = "wss://www.maaee.com:7891/Excoord_SimpleWsServer/simple";
	//this.WS_URL = "ws://192.168.50.34:8891/Excoord_SimpleWsServer/simple";
	this.ws = null;
	this.PING_COMMAND = "ping_0123456789_abcdefg";
	this.PONG_COMMAND = "pong_0123456789_abcdefg";
	this.connected = false;
	this.connecting = false;
	this.connect = function(){
		var connection = this;
		connection.connecting = true;
		connection.ws=new WebSocket(connection.WS_URL);
		 //监听消息
		connection.ws.onmessage = function(event) { 
			connection.connecting = false;
			//如果服务器在发送ping命令,则赶紧回复PONG命令
			if(event.data == connection.PING_COMMAND){
				connection.send(connection.PONG_COMMAND);
				console.log("收到服务器的 ping , 给服务器回复 pong...");
				return;
			}
			if(event.data == connection.PONG_COMMAND){
				console.log("收到服务器的 pong");
				return;
			}
			if(connection.clazzWsListener != null){
				var jsonMessage = eval('(' + ""+event.data+"" + ')');
				//EERO
				if(jsonMessage.statusCode == -1){
					var errorResult = jsonMessage.errorResult;
					connection.clazzWsListener.onError(errorResult.message);
				}//WARNING
				else if(jsonMessage.statusCode == 0){
					var warnResult = jsonMessage.warnResult;
					connection.clazzWsListener.onWarn(warnResult.message);
				}//INFO
				else if(jsonMessage.statusCode == 1){
					var infoResult = jsonMessage.infoResult;
					connection.clazzWsListener.onMessage(infoResult);
				}
			}
        }; 
        // 打开WebSocket 
        connection.ws.onclose = function(event) { 
        	connection.connecting = false;
        	connection.connected = false;
        	connection.reconnect();
        	console.log("收到服务器的 onclose .");
        }; 
        // 打开WebSocket
        connection.ws.onopen = function(event) { 
        	connection.connecting = false;
        	connection.connected = true;
        	console.log("连接到服务器 ....");
        }; 
        connection.ws.onerror =function(event){
        	connection.connecting = false;
        	console.log("收到服务器的 onerror ....");
        };
	};
	
	//每次重连间隔为20秒
	this.reconnect = function(){
		var connection = this;
		if(!connection.connected && !connection.connecting){
			setTimeout(function (){
				connection.connect();
				connection.reconnect();
				console.log("重连中 ...");
			}, 1000*10);
    	}
	};
	
	this.send = function(jsonProtocal){
		var connection = this;
		if(!connection.connecting && connection.connected){
			connection.ws.send(JSON.stringify(jsonProtocal));
		}
	};
	
	//因为网页中和客户端的处理机制还不太一样，网页中的心跳检测时间缩短到10秒钟
	this.heartBeat = function(){
		var connection = this;
		var pingCommand = connection.PING_COMMAND;
		setTimeout(function (){
			connection.send(pingCommand);
			console.log("客户端发送ping命令 , 希望服务器回答pong...");
			connection.heartBeat();
		}, 1000*10);
	};
	
	//此对象一创建就开始心跳检测
	this.heartBeat();
}
function ClazzConnection(){
	this.clazzWsListener = null;
    this.WS_URL = "wss://www.maaee.com:7888/Excoord_PushServer/class";
    this.ws = null;
    this.PING_COMMAND = "ping_0123456789_abcdefg";
    this.PONG_COMMAND = "pong_0123456789_abcdefg";
    this.loginProtocol = null;
    this.connected = false;
    this.connecting = false;
    this.reconnectTimeout;
    this.heartBeatTimeout;
    this.pingButNotRecievePongCount = 0;
    this.connect = function (loginProtocol) {
        var connection = this;
        connection.connecting = true;
        connection.loginProtocol = loginProtocol;
        connection.ws = new WebSocket(connection.WS_URL);
        //监听消息
        connection.ws.onmessage = function (event) {
            connection.connecting = false;
            connection.pingButNotRecievePongCount = 0;
            //如果服务器在发送ping命令,则赶紧回复PONG命令
            if (event.data == connection.PING_COMMAND) {
                connection.send(connection.PONG_COMMAND);
                return;
            }
            if (event.data == connection.PONG_COMMAND) {
                return;
            }
            if (connection.clazzWsListener != null) {
            	var jsonMessage = eval('(' + ""+event.data+"" + ')');
				//EERO
				if(jsonMessage.statusCode == -1){
					var errorResult = jsonMessage.errorResult;
					connection.classOver = true;
					connection.clazzWsListener.onError(errorResult.message);
				}//WARNING
				else if(jsonMessage.statusCode == 0){
					var warnResult = jsonMessage.warnResult;
					connection.clazzWsListener.onWarn(warnResult.message);
				}//INFO
				else if(jsonMessage.statusCode == 1){
					var infoResult = jsonMessage.infoResult;
					var command = infoResult.command;
			    	if(command == "classOver"){
			    		connection.classOver = true;
			    	}else if(command == "studentLogin"){
			    		connection.loginProtocol.reconnect = true;
			    	}else if(command == "teacherLogin"){
			    		connection.loginProtocol.reconnect = true;
			    	}else if(command == "teacherLiveClass"){
			    		connection.loginProtocol.reconnect = true;
			    	}else if(command == "teacherElearningLiveClass"){
			    		connection.loginProtocol.reconnect = true;
			    	}
					connection.clazzWsListener.onMessage(infoResult);
				}
            }
        };
        // 打开WebSocket 
        connection.ws.onclose = function (event) {
            connection.connecting = false;
            connection.connected = false;
            connection.reconnect();
        };
        // 打开WebSocket
        connection.ws.onopen = function (event) {
            connection.connecting = false;
            connection.connected = true;
            connection.pingButNotRecievePongCount = 0;
            connection.send(loginProtocol);
            console.log("class ws 连接到服务器 ...");
        };
        connection.ws.onerror = function (event) {
            connection.connecting = false;
        };
    };

    this.closeConnection = function () {
        var connection = this;
        connection.loginProtocol = null;
        clearTimeout(connection.reconnectTimeout);
        clearTimeout(connection.heartBeatTimeout);
        connection.ws.close();
    };
    
    this.disconnect = function(){
    	var connection = this;
    	connection.closeConnection();
    };

    //每次重连间隔为10秒
    this.reconnect = function () {
        var connection = this;
        if (connection.loginProtocol != null && !connection.connecting && !connection.classOver) {
            connection.reconnectTimeout = setTimeout(function () {
                connection.innerReconnect();
            }, 1000 * 10);
        }
    };

    this.innerReconnect = function(){
        var connection = this;
        if (connection.loginProtocol != null && !connection.connecting && !connection.classOver) {
            connection.connect(connection.loginProtocol);
            console.log("class ws 重连中 ...");
        }
    };

    this.send = function (jsonProtocal) {
        var connection = this;
        if (!connection.connecting && connection.connected) {
            connection.ws.send(JSON.stringify(jsonProtocal));
        }
    };

    //因为网页中和客户端的处理机制还不太一样，网页中的心跳检测时间缩短到10秒钟
    this.heartBeat = function () {
        var connection = this;
        connection.heartBeatTimeout = setTimeout(function () {
            if(connection.pingButNotRecievePongCount >=2 ){
               clearInterval(connection.reconnectTimeout);
               connection.innerReconnect();
            }
            connection.pingButNotRecievePongCount = connection.pingButNotRecievePongCount + 1;
            var pingCommand = connection.PING_COMMAND;
            connection.send(pingCommand);
            connection.heartBeat();
        }, 1000 * 10);
    };

    //此对象一创建就开始心跳检测
    this.heartBeat();
}
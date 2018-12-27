/**
 * Created by Excoord on 2017/5/31.
 */

  // The WebSocket object.
    var socket;
    
    var connected = false;
    var reconnectCount = 0;
    var waitReconnctData = false;
    var lastPong = 0;
    var reconnecting = false;
    var currentDrawTypeIndex;
    var currentColorIndex;
    
    //保存并新建一页画板
    function savePage(onlySave){
    	var protocal = "{'command':'savePage','onlySave':"+onlySave+"}";
    	if(socket != null && connected){
    		socket.send(protocal);
    	}
    }
    
    function showHandout(url){
    	var protocal = "{'command':'draw_image','url':'"+url+"'}";
    	if(socket != null && connected){
    		socket.send(protocal);
    	}
    }

   var Console = {};


(function () {
    document.addEventListener("DOMContentLoaded", function () {

        Console.log = function (message) {
            console.log(message);
        };

        // Initialize the room
        var room = new Room(document.getElementById("drawContainer"));


    }, false);
    
  

    function Room(drawContainer) {

        /* A pausable event forwarder that can be used to pause and
         * resume handling of events (e.g. when we need to wait
         * for a Image's load event before we can process further
         * WebSocket messages).
         * The object's callFunction(func) should be called from an
         * event handler and give the function to handle the event as
         * argument.
         * Call pauseProcessing() to suspend event forwarding and
         * resumeProcessing() to resume it.
         */

    	var hasTouchEvent = "ontouchend" in document ? true : false;
    	console.log("hasTouchEvent--->" + hasTouchEvent);
      
        var isStarted = false;
        var playerCount = 0;

        // An array of PathIdContainer objects that the server
        // did not yet handle.
        // They are ordered by id (ascending).
        var pathsNotHandled = [];

        var nextMsgId = 1;

        var canvasDisplay = document.createElement("canvas");
        var canvasBackground = document.createElement("canvas");
        var canvasServerImage = canvasBackground;
        var canvasArray = [canvasDisplay, canvasBackground,canvasServerImage];
        canvasDisplay.addEventListener(hasTouchEvent?"touchstart":"mousedown", function (e) {
            // Prevent default mouse event to prevent browsers from marking text
            // (and Chrome from displaying the "text" cursor).
            e.preventDefault();
        }, false);

        var labelPlayerCount = document.createTextNode("0");
        var optionContainer = document.createElement("div");


        var canvasDisplayCtx = canvasDisplay.getContext("2d");
        var canvasBackgroundCtx = canvasDisplayCtx;
        var canvasServerImageCtx = canvasDisplayCtx;
        var canvasMouseMoveHandler;
        var canvasMouseDownHandler;

        var isActive = false;
        var mouseInWindow = false;
        var mouseDown = false;
        var currentMouseX = 0, currentMouseY = 0;
        var currentPreviewPath = null;

        var availableColors = [];
        var colorContainers;
        var previewTransparency = 0.65;

        var availableThicknesses = [2, 6, 10, 16, 28];
        var currentThicknessIndex;
        var thicknessContainers;

        var availableDrawTypes = [
            {name: "画笔", id: 1, continuous: true},
            //{name: "直线", id: 2, continuous: false},
            //{name: "矩形", id: 3, continuous: false},
            //{name: "圆型", id: 4, continuous: false},
            {name: "橡皮", id: 5, continuous: true},
        ];
       
        var drawTypeContainers;


        var labelContainer = document.getElementById("labelContainer");
        var placeholder = document.createElement("div");
        placeholder.appendChild(document.createTextNode("Loading... "));
        var progressElem = document.createElement("progress");
        placeholder.appendChild(progressElem);

        labelContainer.appendChild(placeholder);


        function PathIdContainer(path, id) {
            this.path = path;
            this.id = id;
        }
        
        function getQueryString(name) { 
        	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
        	var r = window.location.search.substr(1).match(reg); 
        	if (r != null) return unescape(r[2]); return null; 
        }
        
        //心跳检测
        function heartBeat(){
        	window.setInterval(function () {
        		console.log("draw socket ping...");
        		//给服务器发送ping
        		try{
        			if(socket != null && connected){
        				socket.send("ping_0123456789_abcdefg"); 
        			}
        		 } catch(err){}
                if(!connected && !reconnecting){
        			console.log("重连画板服务...");
        			connect();
        			reconnectCount = reconnectCount + 1;
        		}
                //如果30秒之内没有接收到服务器的pong回复，直接关闭连接重连
                if((new Date().getTime() - lastPong > 1000*30)){
                    socket.onopen = function () {
                    };
                    socket.onclose = function () {
                    };
                    socket.onmessage = function (message) {
                    };
                	socket.close();
                	socket = null;
                	reconnecting = false;
                	connect();
                }
            }, 1000*5);
        }

        function connect() {
        	var roomid = getQueryString("roomid");
        	if(roomid == null){
        		alert("请携带房间号参数！");
        		return;
        	}
            
        	//var host = "ws://192.168.1.34:8787/Excoord_Drawboard/draw?roomid="+roomid;
        	var host = "wss://www.maaee.com:7787/Excoord_Drawboard/draw?roomid="+roomid;
            
            if(reconnecting){
            	return;
            }
            socket = new WebSocket(host);
            reconnecting = true;

            var eventForwarder = new PausableEventForwarder();

            socket.onopen = function () {
            	lastPong = new Date().getTime();
                connected = true;
                reconnecting = false;
            };

            socket.onclose = function () {
            	connected = false;
            	reconnecting = false;
            	waitReconnctData = true;
            	connect();
            };

            // Handles an incoming Websocket message.
            var handleOnMessage = function (message) {
                console.log("===" + message.data );
                
                //收到服务器的ping回复服务器个pong
                if(message.data == 'ping_0123456789_abcdefg'){
                	if(socket != null && connected){
                		socket.send("pong_0123456789_abcdefg");
                	}
                	lastPong = new Date().getTime();
                }else if(message.data == 'pong_0123456789_abcdefg'){
                	lastPong = new Date().getTime();
                } else if(message.data instanceof Blob){
                	if(waitReconnctData){
                		waitReconnctData = false;
                		return;
                	}
                	 // Read the image.
                    var blob = message.data;
                    // Create new blob with correct MIME type.
                    blob = new Blob([blob], {type: "image/png"});
                    var url = URL.createObjectURL(blob);
                    var img = new Image();

                    // We must wait until the onload event is
                    // raised until we can draw the image onto
                    // the canvas.
                    // Therefore we need to pause the event
                    // forwarder until the image is loaded.
                    eventForwarder.pauseProcessing();
                    img.onload = function () {

                        // Release the object URL.
                        URL.revokeObjectURL(url);

                        // Set the canvases to the correct size.
                        for (var i = 0; i < canvasArray.length; i++) {
                            canvasArray[i].width = img.width;
                            canvasArray[i].height = img.height;
                        }

                        // Now draw the image on the last canvas.
                        canvasServerImageCtx.clearRect(0, 0,
                            canvasServerImage.width,
                            canvasServerImage.height);
                        canvasServerImageCtx.drawImage(img, 0, 0);
                        // Draw it on the background canvas.
                        canvasBackgroundCtx.drawImage(canvasServerImage, 0, 0);
                        // Refresh the display canvas.
                        refreshDisplayCanvas();
                        // Finally, resume the event forwarder.
                        eventForwarder.resumeProcessing();
                    };
                    img.src = url;
                }else{
                	 var messages = message.data.split(";");
                     for (var msgArrIdx = 0; msgArrIdx < messages.length;
                          msgArrIdx++) {
                         var msg = messages[msgArrIdx];
                         var type = msg.substring(0, 1);

                         if (type == "0") {
                             // Error message.
                             var error = msg.substring(1);
                             // Log it to the console and show an alert.
                             Console.log("Error: " + error);
                           //  alert(error);

                         } else {
                             if (!isStarted) {
                                 if (type == "2") {
                                     // Initial message. It contains the
                                     // number of players.
                                     // After this message we will receive
                                     // a binary message containing the current
                                     // room image as PNG.
                                     playerCount = parseInt(msg.substring(1));

                                     refreshPlayerCount();

                                     // The next message will be a binary
                                     // message containing the room images
                                     // as PNG. Therefore we temporarily swap
                                     // the message handler.
                                     var originalHandler = handleOnMessage;
                                     handleOnMessage = function (message) {
                                         // First, we restore the original handler.
                                         handleOnMessage = originalHandler;

                                         if(reconnectCount > 0){
                                        	 return;
                                         }
                                         // Read the image.
                                         var blob = message.data;
                                         // Create new blob with correct MIME type.
                                         blob = new Blob([blob], {type: "image/png"});

                                         var url = URL.createObjectURL(blob);

                                         var img = new Image();

                                         // We must wait until the onload event is
                                         // raised until we can draw the image onto
                                         // the canvas.
                                         // Therefore we need to pause the event
                                         // forwarder until the image is loaded.
                                         eventForwarder.pauseProcessing();

                                         img.onload = function () {

                                             // Release the object URL.
                                             URL.revokeObjectURL(url);

                                             // Set the canvases to the correct size.
                                             for (var i = 0; i < canvasArray.length; i++) {
                                                 canvasArray[i].width = img.width;
                                                 canvasArray[i].height = img.height;
                                             }

                                             // Now draw the image on the last canvas.
                                             canvasServerImageCtx.clearRect(0, 0,
                                                 canvasServerImage.width,
                                                 canvasServerImage.height);
                                             canvasServerImageCtx.drawImage(img, 0, 0);
                                             // Draw it on the background canvas.
                                             canvasBackgroundCtx.drawImage(canvasServerImage, 0, 0);
                                             isStarted = true;
                                             startControls();
                                             // Refresh the display canvas.
                                             refreshDisplayCanvas();
                                             // Finally, resume the event forwarder.
                                             eventForwarder.resumeProcessing();
                                         };

                                         img.src = url;
                                     };
                                 }
                             } else {
                                 if (type == "3") {
                                     // The number of players in this room changed.
                                     var playerAdded = msg.substring(1) == "+";
                                     playerCount += playerAdded ? 1 : -1;
                                     refreshPlayerCount();

                                     Console.log("Player " + (playerAdded
                                             ? "joined." : "left."));

                                 } else if (type == "1") {
                                     // We received a new DrawMessage.
                                     var maxLastHandledId = -1;
                                     var drawMessages = msg.substring(1).split("|");
                                     for (var i = 0; i < drawMessages.length; i++) {
                                         var elements = drawMessages[i].split(",");
                                         var lastHandledId = parseInt(elements[0]);
                                         maxLastHandledId = Math.max(maxLastHandledId,
                                             lastHandledId);

                                         var path = new Path(
                                             parseInt(elements[1]),
                                             [parseInt(elements[2]),
                                                 parseInt(elements[3]),
                                                 parseInt(elements[4]),
                                                 parseInt(elements[5]) / 255.0],
                                             parseFloat(elements[6]),
                                             parseFloat(elements[7]),
                                             parseFloat(elements[8]),
                                             parseFloat(elements[9]),
                                             parseFloat(elements[10]),
                                             elements[11] != "0");

                                         // Draw the path onto the last canvas.
                                         path.draw(canvasServerImageCtx);
                                     }

                                     // Draw the last canvas onto the background one.
                                     canvasBackgroundCtx.drawImage(canvasServerImage,0, 0);

                                     // Now go through the pathsNotHandled array and
                                     // remove the paths that were already handled by
                                     // the server.
                                     while (pathsNotHandled.length > 0
                                     && pathsNotHandled[0].id <= maxLastHandledId)
                                         pathsNotHandled.shift();

                                     // Now me must draw the remaining paths onto
                                     // the background canvas.
                                     for (var i = 0; i < pathsNotHandled.length; i++) {
                                         pathsNotHandled[i].path.draw(canvasBackgroundCtx);
                                     }

                                     refreshDisplayCanvas();
                                 }
                             }
                         }
                     }
                }
               
            };

            socket.onmessage = function (message) {
                eventForwarder.callFunction(function () {
                    handleOnMessage(message);
                });
            };

        }


        function refreshPlayerCount() {
            labelPlayerCount.nodeValue = String(playerCount);
        }

        function refreshDisplayCanvas() {
            if (!isActive && !mouseInWindow) { // Don't draw a curser when not active.
                return;
            }
            
            //canvasDisplayCtx.drawImage(canvasBackground, 0, 0);
           
            if (currentPreviewPath != null) {
                // Draw the preview path.
                currentPreviewPath.draw(canvasDisplayCtx);
            } else if (mouseInWindow && !mouseDown) {
            	var drawType = availableDrawTypes[currentDrawTypeIndex];
            	if(drawType.id == 5){
            		/*
            		 canvasDisplayCtx.beginPath();
            		 var array = new Array();
            		 array[0] = 0 ;
            		 array[1] = 0 ;
            		 array[2] = 0 ;
            		 array[3] = 0.5 ;
                     canvasDisplayCtx.fillStyle = tools.rgb(array);
                     canvasDisplayCtx.arc(currentMouseX, currentMouseY,30 / 2, 0, Math.PI * 2.0, true);
                     canvasDisplayCtx.fill();
                     */
            	}
            }

        }

        function startControls() {
            isActive = true;

            labelContainer.removeChild(placeholder);
            placeholder = undefined;

            labelContainer.appendChild(document.createTextNode("Number of Players: "));
            labelContainer.appendChild(labelPlayerCount);


            drawContainer.style.display = "block";
            drawContainer.appendChild(canvasDisplay);

            drawContainer.appendChild(optionContainer);

            canvasMouseDownHandler = function (e) {
            	console.log("mouse down...");
            	if(hasTouchEvent){
            		 var touches = e.touches;
            		 if(touches.length == 1){
            			 currentMouseX = touches[0].pageX - canvasDisplay.offsetLeft;
                         currentMouseY = touches[0].pageY - canvasDisplay.offsetTop;

                         mouseDown = true;
                         canvasMouseMoveHandler(e);
            		 }else{
            			 // Cancel drawing.
                         mouseDown = false;
                         currentPreviewPath = null;

                         currentMouseX = touches[0].pageX - canvasDisplay.offsetLeft;
                         currentMouseY = touches[0].pageY - canvasDisplay.offsetTop;

                         if(mouseInWindow){
                        	 refreshDisplayCanvas();
                         }
            		 }
            	}else{
            		if (e.button == 0) {
                        currentMouseX = e.pageX - canvasDisplay.offsetLeft;
                        currentMouseY = e.pageY - canvasDisplay.offsetTop;

                        mouseDown = true;
                        canvasMouseMoveHandler(e);

                    } else if (mouseDown) {
                        // Cancel drawing.
                        mouseDown = false;
                        currentPreviewPath = null;

                        currentMouseX = e.pageX - canvasDisplay.offsetLeft;
                        currentMouseY = e.pageY - canvasDisplay.offsetTop;

                        refreshDisplayCanvas();
                    }
            	}
                
            };
            canvasDisplay.addEventListener(hasTouchEvent?"touchstart":"mousedown", canvasMouseDownHandler, false);

            canvasMouseMoveHandler = function (e) {
            	if(!mouseInWindow){
            		return;
            	}
                var mouseX = 0;
                var mouseY = 0;
                if(hasTouchEvent){
                	var touches = e.touches;
                	mouseX = touches[0].pageX - canvasDisplay.offsetLeft;
                	mouseY = touches[0].pageY - canvasDisplay.offsetTop;
                	console.log("mousex:"+mouseX+",mousey:"+mouseY+" mousedown:" + mouseDown+" inwndow:" + mouseInWindow);
                }else{
                	mouseX = e.pageX - canvasDisplay.offsetLeft;
                	mouseY = e.pageY - canvasDisplay.offsetTop;
                }
                if (mouseDown) {
                    var drawType = availableDrawTypes[currentDrawTypeIndex];
                    if (drawType.continuous) {

                    	var currentColor = availableColors[currentColorIndex];
                    	
                        var path = new Path(drawType.id,
                        	currentColor,
                            availableThicknesses[currentThicknessIndex],
                            currentMouseX, currentMouseY, mouseX,
                            mouseY, false);
                        // Draw it on the background canvas.
                        path.draw(canvasBackgroundCtx);

                        // Send it to the sever.
                        pushPath(path);

                        // Refresh old coordinates
                        currentMouseX = mouseX;
                        currentMouseY = mouseY;

                    } else {
                        // Create a new preview path.
                        var color = availableColors[currentColorIndex].slice(0);
                        color[3] = previewTransparency;
                        currentPreviewPath = new Path(drawType.id,
                            color,
                            availableThicknesses[currentThicknessIndex],
                            currentMouseX, currentMouseY, mouseX,
                            mouseY, false);
                    }

                    refreshDisplayCanvas();
                } else {
                    currentMouseX = mouseX;
                    currentMouseY = mouseY;

                    if (mouseInWindow) {
                        refreshDisplayCanvas();
                    }
                }

            };
            document.addEventListener(hasTouchEvent?"touchmove":"mousemove", canvasMouseMoveHandler, false);

            document.addEventListener(hasTouchEvent?"touchend":"mouseup", function (e) {
            	
            	if(hasTouchEvent){
            		var touches = e.touches;
           		    if(touches.length == 1){
	           		    if (mouseDown) {
	           		    	console.log("touchend.....");
	                         mouseDown = false;
	                         mouseInWindow = false;
	                         currentPreviewPath = null;
	                        
	                         var mouseX = touches[0].pageX - canvasDisplay.offsetLeft;
	                         var mouseY = touches[0].pageY - canvasDisplay.offsetTop;
	                         
	                         var drawType = availableDrawTypes[currentDrawTypeIndex];
	
	                         var path = new Path(drawType.id, availableColors[currentColorIndex],
	                             availableThicknesses[currentThicknessIndex],
	                             currentMouseX, currentMouseY, mouseX,
	                             mouseY, true);
	                         // Draw it on the background canvas.
	                         path.draw(canvasBackgroundCtx);
	
	                         // Send it to the sever.
	                         pushPath(path);
	
	                         // Refresh old coordinates
	                         currentMouseX = mouseX;
	                         currentMouseY = mouseY;
	
	                         refreshDisplayCanvas();
	                     }
           		    }
            	}else{
            		if (e.button == 0) {
                        if (mouseDown) {
                            mouseDown = false;
                            currentPreviewPath = null;

                            var mouseX = e.pageX - canvasDisplay.offsetLeft;
                            var mouseY = e.pageY - canvasDisplay.offsetTop;
                            
                            var drawType = availableDrawTypes[currentDrawTypeIndex];

                            var path = new Path(drawType.id, availableColors[currentColorIndex],
                                availableThicknesses[currentThicknessIndex],
                                currentMouseX, currentMouseY, mouseX,
                                mouseY, true);
                            // Draw it on the background canvas.
                            path.draw(canvasBackgroundCtx);

                            // Send it to the sever.
                            pushPath(path);

                            // Refresh old coordinates
                            currentMouseX = mouseX;
                            currentMouseY = mouseY;

                            refreshDisplayCanvas();
                        }
                    }
            	}
                
            }, false);

            canvasDisplay.addEventListener(hasTouchEvent?"touchend":"mouseout", function (e) {
                mouseInWindow = false;
                refreshDisplayCanvas();
            }, false);

            canvasDisplay.addEventListener(hasTouchEvent?"touchmove":"mousemove", function (e) {
                if (!mouseInWindow) {
                    mouseInWindow = true;
                    refreshDisplayCanvas();
                }
            }, false);


            // Create color and thickness controls.
            var colorContainersBox = document.createElement("div");
            $(colorContainersBox).attr("id","color_root");
            colorContainersBox.setAttribute("class","draw_line");
            optionContainer.appendChild(colorContainersBox);

            colorContainers = new Array(8);
            //colorContainers = new Array(3 * 3 * 3);
            for (var i = 0; i < colorContainers.length; i++) {
            	var colorItem = document.createElement("div");
            	$(colorItem).addClass("color_item");
                var colorContainer = colorContainers[i] =document.createElement("div");
                var color = availableColors[i] =
                    [
                        Math.floor((i % 3) * 255 / 2),
                        Math.floor((Math.floor(i / 3) % 3) * 255 / 2),
                        Math.floor((Math.floor(i / (3 * 3)) % 3) * 255 / 2),
                        1.0
                    ];
                colorContainer.setAttribute("style"," background-color: " + tools.rgb(color));
                colorContainer.style.border = 'none';
                $(colorContainer).addClass("draw_color");
                colorItem.addEventListener(hasTouchEvent?"touchstart":"mousedown", (function (ix) {
                    return function () {
                        setColor(ix);
                    };
                })(i), false);
                
                colorItem.appendChild(colorContainer);
                colorContainersBox.appendChild(colorItem);
               
            }

            var divClearLeft = document.createElement("div");
            divClearLeft.setAttribute("style", "clear: left;");
            colorContainersBox.appendChild(divClearLeft);


            /*
            var drawTypeContainersBox = document.createElement("div");
            $(drawTypeContainersBox).attr("id","drawtype_root");
            drawTypeContainersBox.setAttribute("class", "draw_line");
            optionContainer.appendChild(drawTypeContainersBox);

            drawTypeContainers = new Array(availableDrawTypes.length);
            for (var i = 0; i < drawTypeContainers.length; i++) {
            	var drawTypeParent =  document.createElement("div");
            	$(drawTypeParent).addClass("drawtype_item");
                var drawTypeContainer = drawTypeContainers[i] =
                    document.createElement("div");
                drawTypeContainer.setAttribute("style",
                    "");
                drawTypeContainer.style.border = "none";
                drawTypeContainer.appendChild(document.createTextNode(
                    String(availableDrawTypes[i].name)));
                drawTypeContainer.addEventListener(hasTouchEvent?"touchstart":"mousedown", (function (ix) {
                    return function () {
                        setDrawType(ix);
                    };
                })(i), false);

                drawTypeParent.appendChild(drawTypeContainer);
                drawTypeContainersBox.appendChild(drawTypeParent);
            }
            */

            /*
            var thicknessContainersBox = document.createElement("div");
            $(thicknessContainersBox).attr("id","thickness_root");
            thicknessContainersBox.setAttribute("class","draw_line");
            optionContainer.appendChild(thicknessContainersBox);

            thicknessContainers = new Array(availableThicknesses.length);
            for (var i = 0; i < thicknessContainers.length; i++) {
            	var thicknessParent = document.createElement("div");
            	$(thicknessParent).addClass("thickness_item");
                var thicknessContainer = thicknessContainers[i] =
                    document.createElement("div");
                thicknessContainer.setAttribute("style",
                    "");
                thicknessContainer.style.border = "none";
                thicknessContainer.appendChild(document.createTextNode(
                    String(availableThicknesses[i])));
                thicknessContainer.addEventListener(hasTouchEvent?"touchstart":"mousedown", (function (ix) {
                    return function () {
                        setThickness(ix);
                    };
                })(i), false);

                thicknessParent.appendChild(thicknessContainer);
                thicknessContainersBox.appendChild(thicknessParent);
            }
     

            divClearLeft = document.createElement("div");
            divClearLeft.setAttribute("style", "clear: left;");
            thicknessContainersBox.appendChild(divClearLeft);
            */

            setColor(2);
            setThickness(0);
            setDrawType(0);

        }

        function disableControls() {
            document.removeEventListener(hasTouchEvent?"touchstart":"mousedown", canvasMouseDownHandler);
            document.removeEventListener(hasTouchEvent?"touchmove":"mousemove", canvasMouseMoveHandler);
            mouseInWindow = false;
            refreshDisplayCanvas();

            isActive = false;
        }

        function pushPath(path) {

            // Push it into the pathsNotHandled array.
            var container = new PathIdContainer(path, nextMsgId++);
            pathsNotHandled.push(container);

            // Send the path to the server.
            var message = container.id + "|" + path.type + ","
                + path.color[0] + "," + path.color[1] + ","
                + path.color[2] + ","
                + Math.round(path.color[3] * 255.0) + ","
                + path.thickness + "," + path.x1 + ","
                + path.y1 + "," + path.x2 + "," + path.y2 + ","
                + (path.lastInChain ? "1" : "0");
            if(socket != null && connected){
            	socket.send("1" + message);
            }
        }

        function setThickness(thicknessIndex) {
            //if (typeof currentThicknessIndex !== "undefined")
            //    thicknessContainers[currentThicknessIndex].style.borderColor = "#000";
            currentThicknessIndex = thicknessIndex;
            //thicknessContainers[currentThicknessIndex]
            //    .style.borderColor = "#d08";
            /*
            var children = $("#thickness_root").children();
            for(var i = 0 ; i < children.size();i++){
            	var child = $(children[i]);
            	if(i == thicknessIndex){
            		child.addClass("select");
            	}else{
            		child.removeClass("select");
            	}
            }
            */
        }
        //连接
        connect();
        //启动心跳检测
        heartBeat();
    }


    function Path(type, color, thickness, x1, y1, x2, y2, lastInChain) {
    	var cColor = new Array();
    	var cThickness = null;
    	if(type == 5){
    		cColor[0] = 255;
    		cColor[1] = 255;
    		cColor[2] = 255;
    		cColor[3] = 1;
    		cThickness = 30;
        }else{
        	cColor[0] = color[0];
    		cColor[1] = color[1];
    		cColor[2] = color[2];
    		cColor[3] = color[3];
    		cThickness = thickness;
        }
        this.type = type;
        this.color = cColor;
        this.thickness = cThickness;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.lastInChain = lastInChain;

        function ellipse(ctx, x, y, w, h) {
            /* Drawing a ellipse cannot be done directly in a
             * CanvasRenderingContext2D - we need to use drawArc()
             * in conjunction with scaling the context so that we
             * get the needed proportion.
             */
            ctx.save();

            // Translate and scale the context so that we can draw
            // an arc at (0, 0) with a radius of 1.
            ctx.translate(x + w / 2, y + h / 2);
            ctx.scale(w / 2, h / 2);

            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2, false);

            ctx.restore();
        }

        this.draw = function (ctx) {
            ctx.beginPath();
            ctx.lineCap = "round";
            ctx.lineWidth = thickness;
            var style = tools.rgb(color);
            ctx.strokeStyle = style;
           
            if (x1 == x2 && y1 == y2) {
                // Always draw as arc to meet the behavior
                // in Java2D.
        		ctx.fillStyle = style;
                ctx.arc(x1, y1, thickness / 2.0, 0,Math.PI * 2.0, false);
                ctx.fill();
            } else {
                if (type == 1 || type == 2) {
                    // Draw a line.
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                } else if (type == 3) {
                    // Draw a rectangle.
                    if (x1 == x2 || y1 == y2) {
                        // Draw as line
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                    }
                } else if (type == 4) {
                    // Draw a ellipse.
                    ellipse(ctx, x1, y1, x2 - x1, y2 - y1);
                    ctx.closePath();
                    ctx.stroke();
                }else if( type==5 ){
                	/*
                   ctx.strokeStyle = tools.rgb(cColor);
            	   ctx.moveTo(x1, y1);
                   ctx.lineTo(x2, y2);
                   ctx.stroke();
                   */
                   //橡皮擦擦拭功能
                   ctx.clearRect(x2-40, y2-40, 80, 80);
                }
            }
        };
    }


    function PausableEventForwarder() {

        var pauseProcessing = false;
        // Queue for buffering functions to be called.
        var functionQueue = [];

        this.callFunction = function (func) {
            // If message processing is paused, we push it
            // into the queue - otherwise we process it directly.
            if (pauseProcessing) {
                functionQueue.push(func);
            } else {
                func();
            }
        };

        this.pauseProcessing = function () {
            pauseProcessing = true;
        };

        this.resumeProcessing = function () {
            pauseProcessing = false;
            // Process all queued functions until some handler calls
            // pauseProcessing() again.
            while (functionQueue.length > 0 && !pauseProcessing) {
                var func = functionQueue.pop();
                func();
            }
        };
    }

    var tools = {
        rgb: function (color) {
            var rgb = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
            return rgb;
        }
    };

})();

function setDrawType(drawTypeIndex) {
    currentDrawTypeIndex = drawTypeIndex;
}

function setColor(colorIndex) {
    currentColorIndex = colorIndex;
    var children = $("#color_root").children();
    for(var i = 0 ; i < children.size();i++){
    	var child = $(children[i]);
    	if(i == currentColorIndex){
    		child.addClass("select");
    	}else{
    		child.removeClass("select");
    	}
    }
}

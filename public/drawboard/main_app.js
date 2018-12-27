var userId = Service.getQueryString("userId");
var defaultPageNo = 1;
var HTML_LIST = "";
var parentId = -1;
var parentArray = [{
    id: -1,
    name: '蚁盘'
}];
filterCloudFile();
// //点击添加按钮
// function showAddAttachment() {
//     AddAttachmentChange('block');
// }


//改变蚁盘元素显示状态
function AddAttachmentChange(style) {
    var mask = document.getElementById('mask');
    var attachment_box = document.getElementById('attachment_box');
    mask.style.display = style;
    attachment_box.style.display = style;
    window.requestAnimationFrame(function () {
        attachment_box.style.transform = style == 'block' ? "translateY(0%)" : "translateY(100%)";
    })


}

//点击遮罩
function clickMask() {
    AddAttachmentChange('none');
    $('.topic_box').css({display: 'none'});
    $('.topic_box').css({transform: 'translate(0%,100%)'});
}

//加载更多
function onEndedPage(e) {
    if (e.srcElement.innerText == "无更多文件") {
        return;
    }
    defaultPageNo += 1;
    filterCloudFile();
}

/*
      * 根据userId获取蚁盘文件
       */
function filterCloudFile(clearFlag) {
    if (clearFlag) {
        HTML_LIST = '';
        defaultPageNo = 1;
        document.getElementById('attachment_bottom').innerText = "点击加载更多";
    }
    var service = new Service();
    var data = {
        method: 'filterCloudFile',
        userId: userId,
        parentId: parentId,
        filterOption: -17,
        pageNo: defaultPageNo,

    };
    service.doWebService(data, {
        onResponse: (res) => {
            console.log(res, 'filterCloudFile');
            if (res.success) {
                var attachment_list = document.getElementById('attachment_list');
                var attachment_bottom = document.getElementById('attachment_bottom');
                var nav = document.getElementById('nav');
                var data = res.response;
                var imgSrc, img_height;
                for (var k in data) {
                    imgSrc = data[k].fileType == 0 ? "../schoolClass/img/cloud_icon_web1.png" : "../schoolClass/img/cloud_icon_web.png";
                    img_height = data[k].fileType == 0 ? 30 : 20;
                    HTML_LIST += "" +
                        "<div onclick=clickFile(" + data[k].fileType + "," + data[k].id + ",\"" + escape(data[k].name) + "\",true,\"" + data[k].suffix + "\",\"" + data[k].htmlPath + "\",\"" + data[k].pdfPath + "\") class='list-item line_public'><img class='item-image' src=" + imgSrc + " style='height:" + img_height + "px' /><span class='item-text text-hidden'>" + data[k].name + "</span></div>";
                }
                var navHTML = "";
                nav.innerHTML = "";
                for (var k in parentArray) {
                    if (k == 0) {
                        navHTML += "<span onclick=clickNav(" + parentArray[k].id + ",\"" + parentArray[k].name + "\") >" + parentArray[k].name + "</span>";

                    } else {
                        navHTML += "<span onclick=clickNav(" + parentArray[k].id + ",\"" + parentArray[k].name + "\") > > " + parentArray[k].name + "</span>";

                    }
                }
                attachment_bottom.innerText = res.response.length <= 0 ? "无更多文件" : "点击加载更多";
                ;
                attachment_list.innerHTML = (HTML_LIST);
                nav.innerHTML = navHTML;
            }
        },
        onError: function (error) {
            console.log(error, 'error');
        }
    });
}


/*
   点击蚁盘文件触发事件
   */
function clickFile(fileType, parent, name, isPush, suffix, htmlPath, pdfPath) {
    console.log(fileType, 'fileType');
    console.log(parent, 'parent');
    console.log(name, 'name');
    console.log(isPush, 'isPush');
    console.log(suffix, 'suffix');
    console.log(htmlPath, 'htmlPath');
    console.log(pdfPath, 'pdfPath');
    var path = suffix == 'ppt' || suffix == "pptx" ? htmlPath : pdfPath;
    name = unescape(name);
    if (fileType == 0) { //文件点击事件
//                 if(path && path != 'null'){
//                     var iframe = document.getElementById("ifr");
//                     var newHTMLPath = path.replace("http://60.205.86.217","https://www.maaee.com");
//                     newHTMLPath = newHTMLPath.replace("http://60.205.111.227","https://www.maaee.com");
//                     iframe.setAttribute("src","https://www.maaee.com/Excoord_For_Education/drawboard/main_app.html?vid="+vid+"&userId="+randomNumber+"&role=manager&ppt="+newHTMLPath+"");
//                     var protocal = eval('(' + "{'command':'assistantPlayKejian','data':{'roomid':'"+vid+"','html':'"+newHTMLPath+"','userId':'"+userId+"'}}" + ')');
//                     //推送通知
//                     simpleMS.send(protocal);
//                     AddAttachmentChange('none');
//                     document.getElementById('empty').style.display="none";
//                     document.getElementById('iframeBox').style.display="block";
//                 }else{
//                    console.log("path为空");
//                 }
    } else {
        parentId = parent;
        if (isPush) {
            parentArray.push({
                id: parent,
                name: name
            });
        }
        filterCloudFile(true);
    }
}

//点击导航栏事件
function clickNav(parentId, parentName) {
    var indexof = '';
    for (var k in parentArray) {
        if (parentArray[k].id == parentId) {
            indexof = parseInt(k) + 1;
        }
    }
    parentArray = parentArray.slice(0, parseInt(indexof));
    clickFile(1, parentId, parentName);
}
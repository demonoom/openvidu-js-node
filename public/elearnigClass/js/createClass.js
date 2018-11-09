var service = new Service();
var teacherId = Service.getQueryString("teacherId");
var teacherName = Service.getQueryString("teacherName");
var html_list="";

$(document).ready(function () {
    getUnionClassList();
});

function getUnionClassList() {
    var data = {
        method: "getCurrentUnionClassList",
        userId: teacherId
    };
    service.doWebService(data, {
        onResponse: function (result) {
            var infos = result.response;
            console.log(infos, 'infos');
            if (infos.length > 0) {
                for(var k in infos){
                    $('.list').append("<div class='list_item'>" +
                        "    <div class='left_image'>" +
                        "    <img src='"+infos[k].openTeacher.avatar+"' alt=''>" +
                        "    </div>" +
                        "    <div class='middle_content'>" +
                        "    <div>"+infos[k].title+" <span>已发布</span></div>" +
                        "    <div>授课老师:"+infos[k].openTeacher.userName+"</div>" +
                        "    <div>上课时间:"+infos[k].startTime+"</div>" +
                        "    <div>课程概述:</div>" +
                        "    </div>" +
                        "    <div class='right_oper'>" +
                        "    <div onclick='live_click()'>直播</div>" +
                        "    <div onclick='editor_click()'>编辑</div>" +
                        "    <div onclick='delete_click()'>删除</div>" +
                        "    </div>" +
                        "    </div>");
                }
            } else {

            }
        }, onError: function (error) {

        }
    })
}

function createClass() {
    console.log(parent.window);
    parent.window.createClass();

}

function live_click(){
    console.log('直播');
}

function editor_click(){
    console.log('编辑');
}

function delete_click(){
    console.log('删除');
}
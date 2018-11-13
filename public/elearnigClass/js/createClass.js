var service = new Service();
var teacherId = Service.getQueryString("teacherId");
var teacherName = Service.getQueryString("teacherName");
var html_list="";

$(document).ready(function () {
    getUnionClassList();
});

function getUnionClassList() {
    $.ajax({
        type: "POST",
//                url: "https://www.maaee.com/Excoord_For_Education/webservice",
        url:"http://192.168.50.15:9007/elearning/elearningControl/",
        data: {
            params: JSON.stringify({
                method: "getCourseByTeacherIdV3",
                userId: teacherId,
                pageNo:"1"
            })
        },
        header: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        success: function (data) {
            var res = JSON.parse(data);
            console.log(res);
            // var res = JSON.parse(res);
            if (res.success) {
                var infos = res.response;
                console.log(infos, 'infos');
                if (infos.length > 0) {
                    for(var k in infos){
                        $('.list').append("<div class='list_item'>" +
                            "    <div class='left_image'>" +
                            "    <img src='"+infos[k].image+"' alt=''>" +
                            "    </div>" +
                            "    <div class='middle_content'>" +
                            "    <div>"+infos[k].courseName+" <span>已发布</span></div>" +
                            "    <div>授课老师:"+infos[k].users[0].userName+"</div>" +
                            "    <div>上课时间:"+formatTime(new Date(infos[k].courseTime))+"---"+formatTime(new Date(infos[k].endTime))+"</div>" +
                            "    <div>课程概述:"+infos[k].content+"</div>" +
                            "    </div>" +
                            "    <div class='right_oper'>" +
                            "    <div onclick='live_click(\""+infos[k].id+"\","+infos[k].publisher_id+")'>直播</div>" +
                            "    <div onclick='editor_click(\""+infos[k].id+"\","+infos[k].publisher_id+")'>编辑</div>" +
                            "    <div onclick='delete_click(\""+infos[k].id+"\","+infos[k].publisher_id+")'>删除</div>" +
                            "    </div>" +
                            "    </div>");
                    }
                }

            }
        },
        error: function (e) {
            console.log(e);
        }
    });
    // var data = {
    //     method: "getCurrentUnionClassList",
    //     userId: teacherId
    // };
    // service.doWebService(data, {
    //     onResponse: function (result) {
    //         var infos = result.response;
    //         console.log(infos, 'infos');
    //         if (infos.length > 0) {
    //             for(var k in infos){
    //                 $('.list').append("<div class='list_item'>" +
    //                     "    <div class='left_image'>" +
    //                     "    <img src='"+infos[k].openTeacher.avatar+"' alt=''>" +
    //                     "    </div>" +
    //                     "    <div class='middle_content'>" +
    //                     "    <div>"+infos[k].title+" <span>已发布</span></div>" +
    //                     "    <div>授课老师:"+infos[k].openTeacher.userName+"</div>" +
    //                     "    <div>上课时间:"+infos[k].startTime+"</div>" +
    //                     "    <div>课程概述:</div>" +
    //                     "    </div>" +
    //                     "    <div class='right_oper'>" +
    //                     "    <div onclick='live_click()'>直播</div>" +
    //                     "    <div onclick='editor_click()'>编辑</div>" +
    //                     "    <div onclick='delete_click()'>删除</div>" +
    //                     "    </div>" +
    //                     "    </div>");
    //             }
    //         } else {
    //
    //         }
    //     }, onError: function (error) {
    //
    //     }
    // })
}

function createClass() {
    // console.log(parent.window);
    parent.window.createClass();

}

function live_click(id,publisher_id){
    // console.log('直播');
    parent.window.showIframe(id,publisher_id);
}

function editor_click(id,publisher_id){
    // console.log('编辑');
    parent.window.updateClass(id,publisher_id);
}

function delete_click(id,publisher_id){
    // console.log('删除');
    parent.window.deleteClass(id,publisher_id);
}

function refresh(){
    location.reload();
}

function formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
//        return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    return [year, month, day].map(formatNumber).join(':');
}
function formatNumber(n) {
    n = n.toString() ;
    return n[1] ? n : '0' + n;
}


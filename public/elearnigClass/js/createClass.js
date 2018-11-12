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
                            "    <div>上课时间:"+infos[k].courseTime+"---"+infos[k].endTime+"</div>" +
                            "    <div>课程概述:"+infos[k].content+"</div>" +
                            "    </div>" +
                            "    <div class='right_oper'>" +
                            "    <div onclick='live_click()'>直播</div>" +
                            "    <div onclick='editor_click("+infos[k].courseClassId+","+infos[k].publisher_id+")'>编辑</div>" +
                            "    <div onclick='delete_click()'>删除</div>" +
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
    console.log(parent.window);
    parent.window.createClass();

}

function live_click(){
    console.log('直播');
}

function editor_click(id,publisher_id){
    console.log('编辑');
    parent.window.updateClass(id,publisher_id);
}

function delete_click(){
    console.log('删除');
}

function refresh(){
    location.reload();
}
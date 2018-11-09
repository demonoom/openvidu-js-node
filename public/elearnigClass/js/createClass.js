var service = new Service();

var teacherId = Service.getQueryString("teacherId");
var teacherName = Service.getQueryString("teacherName");


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
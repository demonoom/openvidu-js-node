var isDebug = false;
var domain = "192.168.50.172";
//云校的api地址
var elearning_api_local = "http://"+domain+":9007/elearning/elearningControl/";
var elearning_api_remote = "https://www.maaee.com/elearning/elearningControl/";
//小蚂蚁api地址
var excoord_api_local = "http://"+domain+":9006/Excoord_ApiServer/webservice";
var excoord_api_remote = "https://www.maaee.com/Excoord_For_Education/webservice";


function Utils() {
    this.elearning_api_url = isDebug?elearning_api_local:elearning_api_remote;
    this.excoord_api_url = isDebug?excoord_api_local:excoord_api_remote;
}

function AppUtils(){

}

AppUtils.getMacAddress = function(){
    var uuid = localStorage.getItem("macAdress");
    if(uuid){
        return uuid;
    }
    uuid = AppUtils.guid();
    localStorage.setItem("macAdress",uuid);
    return uuid;
}

//用于生成uuid
AppUtils.S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
AppUtils.guid = function() {
    return (AppUtils.S4()+AppUtils.S4()+"-"+AppUtils.S4()+"-"+AppUtils.S4()+"-"+AppUtils.S4()+"-"+AppUtils.S4()+AppUtils.S4()+AppUtils.S4());
}
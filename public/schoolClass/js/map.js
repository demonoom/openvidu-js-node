function Map() {
 
    var mapObj = {};
 
    this.put = function (key, value) {
        mapObj[key] = value;
    };
 
    this.remove = function (key) {
        if (mapObj.hasOwnProperty(key)) {
            delete mapObj[key];
        }
    };
 
    this.get = function (key) {
        if (mapObj.hasOwnProperty(key)) {
            return mapObj[key];
        }
        return null;
    };
 
    this.keys = function () {
        var keys = [];
        for(var k in mapObj){
            keys.push(k);
        }
        return keys;
    };
 
    // 遍历map
    this.each = function(fn){
        for(var key in mapObj){
            fn(key, mapObj[key]);
        }
    };
 
    this.toString = function () {
        var str = "{";
        for(var k in mapObj){
            str += "\""+ k+"\" : \""+mapObj[k]+"\",";
        }
        str = str.substring(0,str.length - 1) ;
        str += "}";
        return str;
    };
}
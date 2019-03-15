function Service() {
	this.requesting = false;

	this.WEBSERVICE_URL = "https://www.maaee.com/Excoord_For_Education/webservice";
	//this.WEBSERVICE_URL = "http://192.168.50.172:9006/Excoord_ApiServer/webservice";

	this.pagination = eval('(' + "{'pageNo':0,'pageCount':20,'pageSize':2}" + ')');
	this.messageElement = $("#loading_message");
	this.datas = eval('(' + "[]" + ')');
	if (typeof (this.messageElement) == "undefined") {
		this.messageElement = null;
	}

	/**
	 *  通用执行接口
	 */
	this.doWebService = function(data,listener) {
		var service = this;
		if (service.requesting) {
			return;
		}
		if(typeof(data) == "object"){
			data = JSON.stringify(data);
		}
		service.requesting = true;
		$.post(service.WEBSERVICE_URL, {
			params : data
		}, function(result, status) {
			service.requesting = false;
			if (status == "success") {
				listener.onResponse(result);
			} else {
				listener.onError(result);
			}
		}, "json");
	};
	
	
	/**
	 * 通用查询列表方法
	 */
	this.doListWebService = function(data, listener) {
		var service = this;
		if (service.requesting) {
			return;
		}
		if ((service.pagination.pageNo + 1) <= service.pagination.pageCount) {
			if (service.messageElement != null) {
				service.messageElement.text("正在加载数据...");
			}
			service.requesting = true;
			
			if(typeof(data) != "object"){
				data = JSON.parse(data); 
			}
			
			var pageNo=(Number(service.pagination.pageNo) + 1);
			data["pageNo"]=pageNo;
			
			if(typeof(data) == "object"){
				data = JSON.stringify(data);
			}
			
			$.post(service.WEBSERVICE_URL, {
				params : data
			}, function(result, status) {
				service.requesting = false;
				if (status == "success") {
					service.pagination = result.pager;
					if (service.messageElement != null) {
						service.messageElement.text("数据加载完毕...");
					}
					var dts = result.response;
					if(dts.length == 0){
						if (service.messageElement != null) {
							service.messageElement.text("没有获取到数据...");
						}
					}
					for (var i = 0; i < dts.length; i++) {
						var data = dts[i];
						service.datas.push(data);
					}
					listener.onResponse(result);
				} else {
					if (service.messageElement != null) {
						service.messageElement.text("加载数据失败...");
					}
					listener.onError(result);
				}
			}, "json");
		} else {
			if (service.messageElement != null) {
				service.messageElement.text("没有更多数据!");
			}
		}
	};

    /**
     * 通用查询列表方法
     */
    this.doLoadingListWebService = function(data,loadingEle, listener) {
        var service = this;
        if (service.requesting) {
            return;
        }
        var loading = $(loadingEle);
        if ((service.pagination.pageNo + 1) <= service.pagination.pageCount) {
            service.requesting = true;
            if(typeof(data) != "object"){
                data = JSON.parse(data);
            }

            data["pageNo"]=(Number(service.pagination.pageNo) + 1);

            if(typeof(data) == "object"){
                data = JSON.stringify(data);
            }
            $.post(service.WEBSERVICE_URL, {
                params : data
            }, function(result, status) {
                service.requesting = false;
                if (status == "success") {
                    service.pagination = result.pager;
                    var dts = result.response;
                    for (var i = 0; i < dts.length; i++) {
                        var data = dts[i];
                        service.datas.push(data);
                    }
                    listener.onResponse(result);
                } else {
                    listener.onError(result);
                }
            }, "json");
        } else {
            if (loading != null) {
                var loadingEndText = $(loading).attr("loading_end_text");
                if(loadingEndText != null && typeof(loadingEndText) != 'undefined'){
                    loading.text(loadingEndText);
                }else{
                    loading.text("没有更多数据!");
                }
            }
        }
    };
}


Service.getQueryString = function(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null) {
        return decodeURIComponent(r[2]);
    }
    return null;
}
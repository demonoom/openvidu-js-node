function UiUtils() {
}

UiUtils.toast = function(msg){
	layer.open({
	    content: msg+''
	    ,skin: 'msg'
	    ,time: 2 //2秒后自动关闭
	  });
};

UiUtils.toastPC = function(msg){
	layer.msg(msg,{
		anim: 2//
	});
};
UiUtils.message = function(title,content){
	layer.open({
		  type: 1
		  ,title: title
		  ,area: 'auto'
		  ,offset: '100px' //具体配置参考：offset参数项
		  ,content: content
		  ,btn: '关闭'
		 ,btnAlign: 'c' //按钮居中
		  ,skin: 'shenpi_qian'
		  ,shade: 0 //不显示遮罩
		  ,yes: function(){
		    layer.closeAll();
		    
		  }
		});
};
UiUtils.dialog = function(msg,yesfunction){
	//底部对话框
	  layer.open({
	    content: msg+''
	    ,btn: ['确定', '取消']
	    ,skin: 'footer'
	    ,yes: function(index){
	    	layer.close(index);
	    	yesfunction();
	    }
	  });
};
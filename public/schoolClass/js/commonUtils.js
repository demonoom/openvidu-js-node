function GetDateStr(AddDayCount) { 
		//day = day+AddDayCount;
		var dd = new Date(); 
		dd.setDate(dd.getDate()+AddDayCount);//获取AddDayCount天后的日期 
		var y = dd.getFullYear(); 
		var m = dd.getMonth()+1;//获取当前月份的日期 
		var d = dd.getDate(); 
		if(m<10){
			m = "0"+m;
		}
		if(d<10){
			d = "0"+d;
		}
		return y+"-"+m+"-"+d; 
} 
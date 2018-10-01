    $('#NoticeInfo .noticerow').each(function (event){
        var timeout;
        //鼠标按下 或 手指触摸屏幕时触发
        $(this).bind('touchstart mousedown', function (event) {
            event.stopPropagation();
            event.preventDefault();
            $(this).addClass('bghover');
            timeout = setTimeout(function () {
                $('#editDiv').show(); $('#newDiv').show();
            }, 1000);
        });
        //鼠标松开 或 手指从屏幕上离开时触发
        $(this).bind('touchend mouseup', function (event) {
            clearTimeout(timeout);
            $(this).removeClass('bghover');
        });
        //鼠标移出、手指停止触摸屏幕时触发
        $(this).bind('touchcancel mouseout', function (event) {
            clearTimeout(timeout);
            $(this).removeClass('bghover');
        });
    });
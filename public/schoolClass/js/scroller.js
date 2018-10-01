function Scroller() {
}
Scroller.scroll = function(listener) {
	$(window).scroll(function() {
		var scrollTop =    $(this).scrollTop();
		var scrollHeight = $(document).height();
		var windowHeight = document.body.clientHeight;
		if (scrollTop + windowHeight >= scrollHeight - 50) {
			listener.toBottom();
		}
		if (scrollTop < 400) {
			listener.toTop();
		}
		if (scrollTop >= 400) {
			listener.toMiddle();
		}
	});
};
Scroller.scrollToTop = function() {
	$("html,body").animate({
		scrollTop : 0
	}, 300);
};
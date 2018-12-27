/*!
 * ==========================================================
 *  RANGE SLIDER 2.0.1
 * ==========================================================
 * Author: Taufik Nurrohman <https://github.com/tovic>
 * License: MIT
 * ----------------------------------------------------------
 */

function RS(target, event, vertical) {

    event = event || {};

    var win = window,
        doc = document,
        ranger = doc.createElement('div'),
        dragger = doc.createElement('span'),
        drag = false,
        rangerSize = 0,
        draggerSize = 0,
        rangerDistance = 0,
        cacheValue = 0,
        vertical = vertical || event.vertical || false,
        size = vertical ? 'offsetHeight' : 'offsetWidth',
        css = vertical ? 'top' : 'left',
        page = vertical ? 'pageY' : 'pageX',
        offset = vertical ? 'offsetTop' : 'offsetLeft',
        client = vertical ? 'clientY' : 'clientX',
        scroll = vertical ? 'scrollTop' : 'scrollLeft';
        max = event.max;
        current = 0;

    function isSet(x) {
        return typeof x !== "undefined";
    }

    function isFunc(x) {
        return typeof x === "function";
    }
    
    this.setMax = function (maxNumber){
    	max = maxNumber;
    };
    
    this.getMax = function(){
    	return max;
    };
    
    this.setCurrent = function(currentPage){
    	current = currentPage;
    	setSize();
    	if(max <= 0){
    		dragger.style[css] = (((currentPage / 1) * rangerSize) - (draggerSize / 2)) + 'px';
    	}else{
    		var left = (((currentPage / max) * rangerSize) - (draggerSize / 2));
    		dragger.style[css] =  left+ 'px';
    	}
    };
    
    this.getCurrent = function(){
    	return current;
    };

    function getCoordinate(el) {
        var x = el[offset];
        while (el = el.offsetParent) {
            x += el[offset];
        }
        return x;
    }

    function on(ev, el, fn) {
        if (el.addEventListener) {
            el.addEventListener(ev, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + ev, fn);
        } else {
            el['on' + ev] = fn;
        }
    }

    function off(ev, el, fn) {
        if (el.removeEventListener) {
            el.removeEventListener(ev, fn);
        } else if (el.detachEvent) {
            el.detachEvent('on' + ev, fn);
        } else {
            el['on' + ev] = null;
        }
    }

    function addClass(s, el) {
        if (el.classList) {
            el.classList.add(s);
        } else {
            el.className += ' ' + s;
        }
    }

    addClass('range-slider', target);
    addClass('range-slider-' + (vertical ? 'vertical' : 'horizontal'), target);
    addClass('range-slider-track', ranger);
    addClass('dragger', dragger);

    // `RS(target, function(a, b, c) {})`
    if (isFunc(event)) {
        event = {
            drag: event
        };
    }

    function edge(a, b, c) {
        if (a < b) return b;
        if (a > c) return c;
        return a;
    }

    function preventDefault(e) {
        if (e.preventDefault) e.preventDefault();
        return false;
    }

    function setSize() {
        rangerSize = ranger[size];
        rangerDistance = getCoordinate(ranger);
        draggerSize = dragger[size];
    }

    function dragInit() {
        cacheValue = edge(isSet(event.value) ? event.value : 0, 0, max);
        
        setSize();
        if(max <= 0){
        	dragger.style[css] = (((cacheValue / 1) * rangerSize) - (draggerSize / 2)) + 'px';
        }else{
        	dragger.style[css] = (((cacheValue / max) * rangerSize) - (draggerSize / 2)) + 'px';
        }
        
        if (isFunc(event.create)) event.create(cacheValue, target);
        if (isFunc(event.drag)) event.drag(cacheValue, target);
    }

    function dragStart(e) {
        setSize(), drag = true, dragUpdate(e,"start");
        on("touchmove", doc, dragMove);
        on("mousemove", doc, dragMove);
        if (isFunc(event.start)) event.start(cacheValue, target, e);
        return preventDefault(e);
    }

    function dragMove(e) {
        dragUpdate(e,"move");
        return preventDefault(e);
    }

    function dragStop(e) {
        drag = false;
        off("touchmove", doc, dragMove);
        off("mousemove", doc, dragMove);
        if (isFunc(event.stop)) event.stop(cacheValue, target, e);
        setSize();
        if(max <= 0){
        	 dragger.style[css] = (target.offsetWidth*cacheValue/1-draggerSize/2) + 'px';
        }else{
        	 dragger.style[css] = (target.offsetWidth*cacheValue/max-draggerSize/2) + 'px';
        }
        return preventDefault(e);
    }

    function dragUpdate(e,dragState) {
        e = e || win.event;
        var pos = e.touches ? e.touches[0][page] : e[page],
            move = edge(pos - rangerDistance, 0, rangerSize),
            value = edge(((pos - rangerDistance) / rangerSize) * max, 0, max);
        
        if (!pos) pos = e[client] + doc.body[scroll] + doc.documentElement[scroll];
        
        if (drag) {
        	setSize();
            dragger.style[css] = (move - (draggerSize / 2)) + 'px';
            cacheValue = Math.round(value);
            current = cacheValue;
            if (isFunc(event.drag)) event.drag(cacheValue, target, dragState);
        }
    }

    on("touchstart", ranger, dragStart);
    on("mousedown", ranger, dragStart);

    on("touchend", ranger, dragStop);
    on("mouseup", ranger, dragStop);
    on("mouseleave", ranger, function(){
    	if(drag){
    		dragStop();
    	}
    });
    on("readystatechange", doc, function(){
    	if(document.readyState == "complete"){
    		setTimeout(function(){
    			setSize(), drag = false;
    			if(max <= 0){
    				dragger.style[css] = (((cacheValue / 1) * rangerSize) - (draggerSize / 2)) + 'px';
    			}else{
    				var left = (((cacheValue / max) * rangerSize) - (draggerSize / 2));
    				dragger.style[css] = left + 'px';
    			}
    		}, 50);
    	}
    });

    on("resize", win, function(e) {
        setSize(), drag = false;
        if(max <= 0){
        	dragger.style[css] = (((cacheValue / 1) * rangerSize) - (draggerSize / 2)) + 'px';
        }else{
        	dragger.style[css] = (((cacheValue / max) * rangerSize) - (draggerSize / 2)) + 'px';
        }
    });

    ranger.appendChild(dragger);
    target.appendChild(ranger);
    
}
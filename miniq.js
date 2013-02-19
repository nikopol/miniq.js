// miniq.js 0.1 - niko 2013

/*
one more mini jquery-like library for modern browsers

support firefox, opera, chrome, safari, and IE9+ with the following header
<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>

CONSTRUCTOR ==================================================================

  $(function)       : setup a callback when dom is ready (same as $.ready(fn))
  $("html")         : return a collection of created elements
  $("selector")     : return a collection of matching elements

DOM ==========================================================================

  .append("html")   : append html
  .append(col)      : append collection of elements
  .to("selector")   : append itself to the selector
  .to(col)          : append itself to the collection
  .remove()         : remove elements from the DOM
  .html()           : return inner html of the first element
  .html("html")     : set the inner html
  .val()            : return value of the first element
  .val(value)       : set value

CSS ==========================================================================

  .css({key:val})   : apply styles
  .css("key","val") : apply style
  .css("style")     : return style of the first element
  .cls()            : return classname of the first element
  .cls("+a-b*c")    : relatively set classname : +add a, -remove b, *switch c
  .cls("a")         : set classname
  .show()           : proxy for .css({display: null})
  .hide()           : proxy for .css({display: 'none'})
  .pos()            : return {width,height,top,left} of the first element
  .pos(n)           : return {width,height,top,left} of the n th element

EVENTS =======================================================================

  .bind("event1 event2",function) : add event(s) listener
  .unbind("event",function)       : remove event(s) listener
  .fire("event")                  : trigger events
  .focus(function)                :     for all the followings events,
  .blur(function)                 :     if function is not provided,
  .focusin(function)              :     the event is triggered
  .focusout(function)
  .load(function)
  .resize(function)
  .scroll(function)
  .unload(function)
  .click(function)
  .dblclick(function)
  .mousedown(function)
  .mouseup(function)
  .mousemove(function)
  .mouseover(function)
  .mouseout(function)
  .mouseenter(function)
  .mouseleave(function)
  .change(function)
  .select(function)
  .keydown(function)
  .keypress(function)
  .keyup(function)
  .error(function)
  .animationstart(function)
  .animationend(function)
  .animationiteration(function)
  .touchstart(function)
  .touchend(function)
  .touchmove(function)
  .orientationchange(function)

MISC =========================================================================

  .list                : return the collection array
  .length              : return the length of the collection
  .each(function(e){}) : callback for each elements

GLOBALS ======================================================================

 $.ready(function)  : setup a callback when dom is ready
 $.extend({},...)   : extend an object
 $.ajax("url",fn)   : do a GET ajax and callback fn on success 
 $.ajax({options})  : do an ajax call, available options are:
                        type: "GET"                  : HTTP verb
                        url: "url"                   : url to call
                        datatype: "application/json" : format requested
                        data: {key:val}              : parameters/payload
                        data: "params"               : parameters/payload
                        success: function            : callback on success
                        error: function              : callback on error
                        jsonp; bool                  : set 
                        timeout: sec                 : timeout

PLUGINS ======================================================================

if you need an access to the collection, just extend the miniq.prototype 
as follows :
  
  miniq.prototype.helloworld=function(){ 
  	console.log("hello world",this.list)
  };

otherwise extend $

  $.helloworld=function(){ 
  	console.log("hello world")
  };

*/

/* CORE */

var $ = (function(){
	"use strict";

	var
	$,
	P = 0,
	W = window,
	D = W.document,
	V = function(e,v){
		if(e && 'value' in e){
			var c = e.type[0]=='c', s = e.type[0]=='s';
			if(v==undefined) return c ? e.checked : e.value;
			if(c) e.checked = !!v;
			else if(s) [].slice.call(e.options).forEach(function(o,n){ if(o.value==v) e.selectedIndex = n });
			else e.value = v;
		}
		return null;
	};

	W.miniq = function(s){
		var L = [],n,c,b;
		if(s!=undefined) {
			if(typeof(s)=='function') {
				$.ready(s);
			} else if(typeof(s)=='object') {
				if('length' in s) L = [].slice.call(s);
				else L.push(s);
			} else if(typeof(s)=='string') {
				if(/^<.+>$/.test(s)) {
					b = D.createElement('div');
					b.innerHTML = s;
					c = b.childNodes;
				} else
					c = D.querySelectorAll(s);
				L = [].slice.call(c);
			}
			//[] operator
			for(n=0; n<L.length; this[n] = L[n++]);
		}
		this.length = L.length;
		this.list = L;
		return this;
	};

	$ = function(s){
		return new miniq(s);
	};

	$.ready = function(cb){
		if(/complete|loaded|interactive/.test(D.readyState)) cb();
		//else if(D.attachEvent) D.attachEvent('ondocumentready',cb()); 
		else D.addEventListener('DOMContentLoaded',function(){cb()});
		return $;
	};

	$.error = function(e){
		console.error(e);
	};

	$.extend = function(dst){
		var args = [].slice.call(arguments,1),src,k;
		if(dst==undefined || typeof(dst)!='object') dst = {};
		while(src = args.shift())
			for(k in src)
				dst[k] = !(k in dst) || typeof(src[k]) != 'object'
					? src[k]
					: $.extend(dst[k],src[k]);
		return dst;
	}

	$.ajax = function(o,cb){
		if(typeof(o)=='string') o = { url:o, ok:cb };
		var
		type = o.type || 'GET',
		url  = o.url || '',
		ctyp = o.contenttype || 'application/x-www-form-urlencoded',
		dtyp = o.datatype || 'application/json',
		xhr  = o.jsonp || new W.XMLHttpRequest(),
		err  = o.error || $.error,
		ok   = o.success || function(){},
		timer,d,n;
		if(o.data){
			if(typeof(o.data)=='string')
				d = o.data;
			else if(/json/.test(ctyp)) 
				d = JSON.stringify(o.data);
			else {
				d = [];
				for(n in o.data)
					d.push(encodeURIComponent(n)+'='+encodeURIComponent(o.data[n]));
				d = d.join('&');
			}
			if(/GET|DEL/i.test(type) || o.jsonp) {
				url += /\?/.test(url) ? '&'+d : '?'+d;
				d = '';
			}
		}
		if(o.jsonp) {
			if(P) $('#jsonp'+(D-1)).remove();
			d = D.createElement('script');
			n = "jsonp"+P++;
			W[n] = ok;
			d.onerror = err;
			d.src = 
				/=\?/.test(url) ? url.replace(/=\?/,'='+n) :
				/\?/.test(url) ? url+'&callback='+n :
				url+'?callback='+n;
			$('head').append(d);
		} else {
			xhr.onreadystatechange = function(){
				if(xhr.readyState==4) {
					if(timer) clearTimeout(timer);
					if(/^2/.test(xhr.status)) {
						d=xhr.responseText;
						if(/json/.test(dtyp)) {
							try      { d = JSON.parse(xhr.responseText) }
							catch(e) { return o.error('json parse error: '+e.message,xhr) }
						}
						ok(d,xhr);
					} else
						err(xhr.responseText,xhr);
				}
			};
			xhr.open(type, url, true);
			xhr.setRequestHeader('Content-Type', ctyp);
			if(o.headers) 
				for(n in o.headers)
					xhr.setRequestHeader(n, o.headers[n]);
			if(o.timeout) timer = setTimeout(function(){
				xhr.onreadystatechange = function(){};
				xhr.abort();
				err('timeout',xhr);
			}, o.timeout*1000);
			xhr.send(d);
		}
		return xhr;
	};

	W.miniq.prototype = {

		/*MISC*/

		ready: $.ready,
		
		ajax: $.ajax,

		each: function(cb){
			var _ = this;
			_.list.forEach(function(o){ cb.call(_,o) });
			return _;
		},

		/*DOM*/

		append: function(s){
			return this.each(function(o){
				$(s).each(function(a){ o.appendChild(a) })
			});
		},

		to: function(s){
			$(s).append(this.list);
			return this;
		},

		remove: function(){
			return this.each(function(o){
				$(s).list.forEach(function(a){ o.parent.removeChild(o) })
			});
		},

		html: function(s){
			return s==undefined 
				? (this.length ? this[0].innerHTML : null)
				: this.each(function(o){ o.innerHTML = s });
		},

		val: function(s){
			return s==undefined
				? V(this[0])
				: this.each(function(o){ V(o,s) });
		},

		attr: function(s){
			if(typeof(s)=='string') return this.length ? this[0].getAttribute(s) : null;
			for(var k in s) this.each(function(o){ o.setAttribute(k,s[k]) });
			return this;
		},

		cls: function(c){
			if(c==undefined) return this.length ? this[0].className : null;
			var m,z,v,q=/([\+\-\*])([^\+\-\*\s]+)/g;
			if( /^[\+\-\*]/.test(c) ) {
				while((m = q.exec(c)) !== null) {
					z = m[1];
					v = m[2];
					this.each(function(o){
						var w = o.className.split(/\s+/).filter(function(n){return n});
						if(z!='-' && w.indexOf(v)==-1) w.push(v); //add class
						else if(z!='+') w=w.filter(function(n){return n!=v}); //remove class
						o.className = w.join(' ');
					});
				}
			} else
				this.each(function(o){ o.className = c });
			return this;
		},

		css: function(c,v){
			if(c==undefined) return this.length ? this[0].style : null;
			if(typeof(c)=='object') 
				this.each(function(o){ 
					for(var z in c)
						o.style[z] = c[z]
				});
			else if(typeof(c)=='string') {
				if(v==undefined) return this.length ? this[0].style[c] : null;
				this.each(function(o){ o.style[c] = v });
			}
			return this;
		},
		
		show: function(){
			return this.css({display: null});
		},

		hide: function(){
			return this.css({display: 'none'});
		},

		pos: function(n){
			n = n||0;
			if(n in this) {
				var 
				o = this[n]===D ? D.body : this[n],
				r = o.getBoundingClientRect();
				return {
					left:   r.left+W.pageXOffset,
					top:    r.top+W.pageYOffset,
					width:  r.width,
					height: r.height
				};
			}
			return null;
		},

		/*EVENTS*/

		bind: function(ev,cb){
			return this.each(function(o){
				ev.split(/\s+/).forEach(function(e){ o.addEventListener(e,cb) });
			});
		},

		unbind: function(ev,cb){
			return this.each(function(o){
				ev.split(/\s+/).forEach(function(e){ o.removeEventListener(e,cb) });
			});
		},

		fire: function(ev){
			return this.each(function(o){
				ev.split(/\s+/).forEach(function(e){
					var c;
					if(D.createEvent){
						c = D.createEvent("Events");
						c.initEvent(e,true,true);
						o.dispatchEvent(c);
					} else {
						c = D.createEventObject();
						o.fireEvent('on'+event,c);
					}
				});
			});
		}

	};
	//setup event fn
	"focus blur focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error animationstart animationend animationiteration touchstart touchend touchmove orientationchange"
		.split(' ').forEach(function(e){
			W.miniq.prototype[e]=function(cb){ return cb ? this.bind(e,cb) : this.fire(e) };
		});

	return $;
})();
;
(function($, window, document, undefined) {

	var pluginName = "transforming", 
		// simple browsertest
		isoldie = navigator.appName=="Microsoft Internet Explorer" && (parseInt(navigator.appVersion)<5),
		// default parameters
		defaults = {
			rotate : 0,
			rotateX : 0,
			rotateY : 0,
			rotateZ : 0,
			scale : 1,
			scaleX : 1,
			scaleY : 1,
			skew:0,
			skewX : 0,
			skewY : 0 
		};

	function Plugin(element, options) {
		this.element = $(element);
		// copy to settings and to defaults
		this.settings = $.extend({}, defaults, options);
		this.defaults = $.extend({}, defaults, options);
		if (isoldie) {
			// for old ie we need initial positioning/size information for 
			// the transform origin workaround
			var el =this.element[0];
			this.element.data("ieprop",{
				offsetWidth:el.offsetWidth,
				offsetHeight:el.offsetHeight,
				
				position:this.element.position(),
				isabsolute:this.element.css("position")=="absolute",
				marginLeft:parseInt(this.element.css("margin-left"))||0,
				marginTop:parseInt(this.element.css("margin-top"))||0
			});
		}

		this.init(options);
	}

	Plugin.prototype = {
		init : function(opts) {
			$.extend(this.settings,opts);
			
			this.applytransform();

		},
		reset: function() {
			// stop animation and reset to initial state
			this.element.stop();
			this.init(this.defaults);
		},
		applytransform: isoldie
			// for old ies <=8 the old ms filter with a matrix transform is used
			? function() {

				// matrix multiplication 
				function matmul(m1,m2) {
					return [
					 	[m1[0][0]*m2[0][0]+m1[0][1]*m2[1][0]+m1[0][2]*m2[2][0], 
					 	 m1[0][0]*m2[0][1]+m1[0][1]*m2[1][1]+m1[0][2]*m2[2][1], 
						 m1[0][0]*m2[0][2]+m1[0][1]*m2[1][2]+m1[0][2]*m2[2][2]],
	
						[m1[1][0]*m2[0][0]+m1[1][1]*m2[1][0]+m1[1][2]*m2[2][0], 
						 m1[1][0]*m2[0][1]+m1[1][1]*m2[1][1]+m1[1][2]*m2[2][1], 
						 m1[1][0]*m2[0][2]+m1[1][1]*m2[1][2]+m1[1][2]*m2[2][2]],
	
						[m1[2][0]*m2[0][0]+m1[2][1]*m2[1][0]+m1[2][2]*m2[2][0], 
						 m1[2][0]*m2[0][1]+m1[2][1]*m2[1][1]+m1[2][2]*m2[2][1], 
						 m1[2][0]*m2[0][2]+m1[2][1]*m2[1][2]+m1[2][2]*m2[2][2]]
					];
				};

				// degree to radians
				function torad(deg){
					return deg * Math.PI / 180.0;
				};

				var s = this.settings,
					mtx = [[1,0,0],[0,1,0],[0,0,1]];

				// apply rotate OR rotateX/rotateY/rotateZ
				if (s.rotate!=0){
					var a = torad(s.rotate), 
						sina = Math.sin(a),
						cosa = Math.cos(a);
					mtx = matmul(mtx,[[cosa,-sina,0],[sina,cosa,0],[0,0,1]]);
				} else {
					
					if (s.rotateX!=0){
						var a = torad(s.rotateX), 
							sina = Math.sin(a),
							cosa = Math.cos(a);
						mtx = matmul(mtx,[[1,0,0],[0,cosa,-sina],[0,sina,cosa]]);
					}
	
					if (s.rotateY!=0){
						var a = torad(s.rotatY), 
							sina = Math.sin(a),
							cosa = Math.cos(a);
						mtx = matmul(mtx,[[cosa,0,sina],[0,1,0],[-sina,0,cosa]]);
					}
	
					if (s.rotateZ!=0){
						var a = torad(s.rotateZ), 
							sina = Math.sin(a),
							cosa = Math.cos(a);
						mtx = matmul(mtx,[[cosa,-sina,0],[sina,cosa,0],[0,0,1]]);
					}
				}
				
				if (s.scale!=1){
					mtx = matmul(mtx,[[s.scale,0,0],[0,s.scale,0],[0,0,1]]);
				} else {
					if (s.scaleX!=1){
						mtx = matmul(mtx,[[s.scaleX,0,0],[0,1,0],[0,0,1]]);
					}
					
					if (s.scaleY!=1){
						mtx = matmul(mtx,[[1,0,0],[0,s.scaleY,0],[0,0,1]]);
					}
				}

				if (s.skew!=1){
					mtx = matmul(mtx,[[1,0,0],[Math.tan(torad(s.skew)),1,0],[0,0,1]]);
				} else {

					if (s.skewX!=1){
						mtx = matmul(mtx,[[1,Math.tan(torad(s.skewX)),0],[0,1,0],[0,0,1]]);
					}
	
					if (s.skewY!=1){
						mtx = matmul(mtx,[[1,0,0],[Math.tan(torad(s.skewY)),1,0],[0,0,1]]);
					}
				}

				var orig = this.element.data("ieprop"),
					el = this.element[0];
				el.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11="+mtx[0][0]+", M12="+mtx[0][1]+", M21="+mtx[1][0]+", M22="+mtx[1][1]+", sizingMethod='auto expand')";

				if (orig.isabsolute) {
					el.style['left' ] = ((orig.offsetWidth-el.offsetWidth)/2 +orig.position.left)  + "px";
					el.style['top' ] =  ((orig.offsetHeight-el.offsetHeight)/2+orig.position.top)  + "px";
				}else {
					// @todo: add orig margin
					el.style['marginLeft' ] = ((orig.offsetWidth-el.offsetWidth)/2 +orig.marginLeft)  + "px";
					el.style['marginTop' ] = ((orig.offsetHeight-el.offsetHeight)/2+orig.marginTop)  + "px";
				}
			}
			// css transform for cool browsers 
			: function () {
				var trstr = [],
					s = this.settings;
				
				// apply rotate OR rotateX/rotateY/rotateZ
				if (s.rotate!=0) {
					trstr.push("rotate("+s.rotate+"deg)");
				} else {
					if (s.rotateX!=0)trstr.push("rotateX("+s.rotateX+"deg)");
					if (s.rotateY!=0)trstr.push("rotateY("+s.rotateY+"deg)");
					if (s.rotateZ!=0)trstr.push("rotateZ("+s.rotateZ+"deg)");
				}
	
				// apply scale OR scaleX/scaleY
				if (s.scale!=1.0) {
					trstr.push("scale("+s.scale+")");
				} else {
					if (s.scaleX!=1.0)trstr.push("scaleX("+s.scaleX+")");
					if (s.scaleY!=1.0)trstr.push("scaleY("+s.scaleY+")");
				}
				// apply skew OR skewX/skewY
				if (s.skew!=0.0) {
					trstr.push("skew("+s.skew+"deg)");
				} else {
					if (s.skewX!=0)trstr.push("skewX("+s.skewX+"deg)");
					if (s.skewY!=0)trstr.push("skewY("+s.skewY+"deg)");
				}

				trstr = trstr.join(" ");
				this.element.css({
					"-moz-transform":trstr,
					"-webkit-transform":trstr,
					"-o-transform":trstr,
					"-ms-transform":trstr,
					"transform":trstr
				});
				
			},
		toggle:function(opts) {
			var istoggledon = this.element.data("toggled-on");
			if (istoggledon) {
				this.element.transforming("animate", {
					reverse : 1,
					easingreverse : opts.easingreverse || opts.easing,
					durationreverse : opts.durationreverse || opts.duration
				});
			} else {
				this.element.transforming("animate",opts||this.defaults);
			}
				
			this.element.data("toggled-on",!istoggledon);
		},
		hover: function(opts) {

			this.element
				.on("mouseenter.transforming",function(){
					$(this).transforming("animate",opts);
				})
				.on("mouseleave.transforming",function() {
					$(this).transforming("animate", {
						reverse : 1,
						easingreverse : opts.easingreverse || opts.easing,
						durationreverse : opts.durationreverse || opts.duration
	
					});
			});
		},
		animate: function(opts){
			if (!opts) opts=this.defaults;
			var el=this,from,to;
			if (opts.animateto) {
				from = $.extend({},this.settings);
				to = opts.animateto;
				
			} else {
				from = this.defaults;
				to = $.extend({},this.settings);
			};
			el.element.removeClass("transforming-anim-rev transforming-anim");
			if (opts.reverse) {
				var swap=to;
				to=from;
				from=swap;
				el.element.addClass("transforming-anim-rev");
				if (opts.beforeanimateout) {
					opts.beforeanimateout(el.element);
				}
			} else {
				el.element.addClass("transforming-anim");
				if (opts.beforeanimatein) {
					opts.beforeanimatein(el.element);
				}
			}
			
			
			$.extend(this.settings,from);


			this.element.stop().css("x-animation",0).animate({"x-animation":1}, {
				easing:opts.reverse ? opts.easingreverse || opts.easing || "linear" : opts.easing ||"linear",
				duration:opts.reverse ? opts.durationreverse || opts.duration || 1000 : opts.duration || 1000,
				step: function(t) {
					$.each(to, function(key){
						
						el.settings[key]=parseFloat(from[key])+t*(parseFloat(to[key])-parseFloat(from[key]));
						
					});
					el.applytransform();

					// if supplied, call step callback
					if (opts.step) {
						opts.step(t, el.element);
					};
				},
				complete: function() {
					if (opts.reverse) {
						el.element.removeClass("transforming-anim-rev transformed-on").addClass("transformed-default");
						if (opts.afteranimateout) {
							opts.afteranimateout(el.element);
						}
					} else  {
						el.element.removeClass("transforming-anim transformed-default").addClass("transformed-on");
						if (opts.afteranimatein) {
							opts.afteranimatein(el.element);
						}
					} 
					// if supplied, call complete callback
					if (opts.complete) {
						opts.complete(el.element);
					};
					
				}
			});
			
		}
	};


	$.fn[pluginName] = function(meth,options) {
		return this
			.each(function() {
				var pi = $.data(this, "plugin-" + pluginName);
				if (typeof meth!="string") {
					options = meth;
					meth="init";
				}
				if (!pi) {
					$.data(this, "plugin-" + pluginName, pi = new Plugin(this, options));
				} 

				if (pi[meth])
					pi[meth](options||pi.defaults);
				
			});
	};

})(jQuery, window, document);
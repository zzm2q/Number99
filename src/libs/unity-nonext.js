/**
 *  这个抽象的游戏对象类是所有游戏对象的基础类，不能直接被使用。
 *
 *  该类定义了这个引擎的所有游戏对象都是以树型结构连接的，同时定
 *  义了与树型结构相关的通用操作。
 *
 *  该继承自 IDE.engine.events.EventTarget，以实现树型结构中
 *  的捕获和冒泡事件调度。与 DOM/Flash 的事件调度类似。
 *
 */
Ext.define('Unity.AbstractGameObject', {

	extend :  Ext.util.MixedCollection ,

	/**
	 * 一个快速判断此对象是否为游戏对象的属性
	 * @readonly
	 */
	isGameObject : true,

	/**
	 * 唯一标识
	 * @readonly
	 */
	id : null,

	/**
	 * 游戏对象的名字
	 * @readonly
	 */
	name : null,

	/**
	 *	@private
	 */
	tags : null,

	/**
	 *	@private
	 */
	tagHash : null,

	/**
	 * @private
	 */
	_parent : null,

	constructor : function(config) {
		this.callParent();
		Ext.apply(this, config);
	},

    fireEvent : function(eventName, event) {
        if(event && event.isUnityEvent) {
            event.type = eventName;
            this.continueFireUnityEvent(eventName.toLowerCase(), event);
        } else {
            this.callParent(arguments);
        }
    },

    continueFireUnityEvent : function(eventName, unityEvent) {
        var event, parentGameObject;
        unityEvent.currentTarget = this;
        event = this.events[eventName];
        if(event && event !== true) {
            event.fire(unityEvent);
        }
        event = this.events['*'];
        if(event && event !== true) {
            event.fire(unityEvent);
        }
        if(unityEvent.bubbles && !unityEvent.isStopPropagation()) {
            parentGameObject = this.parent();
            if(parentGameObject) {
                parentGameObject.fireEvent(eventName, unityEvent);
            }
        }
    },

	doInsert : function() {
        var me = this;
		var objects = this.callParent(arguments);
		objects.forEach(function(object) {
			object._parent = me;
		});
		return objects;
	},

	removeAt : function() {
		var result = this.callParent(arguments);
		result._parent = null;
		return result;
	},

    remove : function(target) {
        this.callParent(arguments);
        target._parent = null;
    },

	clear : function() {
		this.each(function(child) {
			child._parent = null;
		});
		this.callParent(arguments);
	},

	/**
	 * Derive the key for the new item, see @{link Ext.util.AbstractMixedCollection getKey }
	 * @param item
	 * @returns {String}
	 */
	getKey : function(item) {
		return item.name;
	},

	/**
	 * @private
	 * @returns {Unity.AbstractGameObject}
	 */
	getBubbleParent : function() {
		return this.parent();
	},

	/**
	 * Change the name of this game object
	 * @param name
	 */
	setName : function(name) {
		this.parent().updateKey(this.name, name);
		this.name = name;
	},

	parent : function() {
		return this._parent;
	},

	child : function(name) {
		return this.getByKey(name);
	},

	childAt : function(index) {
		return this.getAt(index);
	},

	children : function(name) {
		if(!name) {
			return this.getRange();
		}
		return this.findBy(function(child) {
			return child.name === name;
		});
	},

    indexAtParent : function() {
        return this.parent().indexOf(this);
    },

	isTagged : function(tag) {
		return this.tagHash && this.tagHash[tag];
	},

    removeTag : function(tag) {
        if(this.tagHash) {
            delete this.tagHash[tag];
        }
    },

    removeMe : function(destroy) {
        var parent = this.parent();
        parent && parent.remove(this);
    },

	getByPath : function(path) {
		var i, len, name;
        if(path.indexOf(Unity.NESTED_OFILE_PREFIX) === -1) {
            var names = path.split('/');
            var obj = this;
            for(i=0,len=names.length; i<len; i++) {
                name = names[i];
                obj = obj.child(name);
                if(!obj) {
                    return null;
                }
            }
            return obj;
        } else {
            var atSplit = path.split(Unity.NESTED_OFILE_PREFIX);
            var obj = this.getByPath(atSplit[0].substr(0, atSplit[0].length-1));
            if(!obj) return obj;
            return obj.child(Unity.NESTED_OFILE_PREFIX + atSplit[1]);
        }

	},

	getPath : function(seperator) {
		var o = this;
		var path = [];
		while(o && !o.isStage) {
			path.unshift(o.name);
			o = o._parent;
		}
		return path.join(seperator || '/');
	},

    getStage : function() {
        return Unity.stage;
    }

});

Ext.define('Unity.Unity', {});

(function(global) {

	global.Unity = global.Unity || {};


	Ext.apply(Unity, {
		UPDATE : 'update',
		DRAW : 'draw',
		CLIP : 'clip',
		TESTHIT : 'testHit',
		LAYOUT : 'layout',

		CTYPE_PREFIX : 'unity.component.',
        NESTED_OFILE_PREFIX : '@'
	});

	Ext.apply(Unity, {

		global : global,

		stage : null,

		onReady : Ext.onReady,

		create : function(alias, config) {
			return Ext.create(Unity.CTYPE_PREFIX + alias, config);
		},

		createCanvas : function(width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			return canvas;
		},

		createStage : function(config) {
			Unity.stage = new Unity.Stage(config);
			return Unity.stage;
		},

		quicklyStartStage : function(id, width, height, callback) {
			Unity.onReady(function() {
				var stage = Unity.createStage({
					canvas : document.getElementById(id),
					width : width,
					height: height
				});
				stage.start();
				callback(stage);
			});
		},

		loadAssets : function(gameObject, callback, onProgress) {
            Unity.Builder.loadAssets(gameObject, callback, onProgress);
		},

		buildGameObject : function(objData, onFinished) {
			Unity.Builder.buildGameObject(objData, onFinished);
		},

		loadGameObject : function(params) {
            Unity.Builder.loadGameObject(params);
		},

        schedule : function(task, frame, args) {
            frame = frame || 0;
            Unity.stage.scheduleTime(task, frame, args);
        },

        scheduleTime : function(task, time, args) {
            time = time || 0;
            Unity.stage.scheduleTime(task, time, args);
        }
	});

})(window);

Ext.define('Unity.Time', {

	singleton : true,

	delta : 0,

	now : 0,

	measuredFPS : 0,

	update : function(speed) {
		var now = Date.now();
		if(this.now) {
			this.delta = (now - this.now) * speed;
            this.now += this.delta;
			this.measuredFPS = 1000/this.delta;
		} else {
            this.now = now;
        }
	},

	reset : function() {
		this.delta = 0;
		this.now = 0;
	}

});

Ext.define('Unity.Event', {

    isUnityEvent : true,

    type : null,
    target : null,
    currentTarget : null,
    bubbles : true,

    propagationStoped : false,

    constructor : function(config) {
        Ext.apply(this, config);
    },

    isStopPropagation : function() {
        return this.propagationStoped;
    },

    stopPropagation : function() {
        this.propagationStoped = true;
    }

});

Ext.define('Unity.GestureEvent', {

    extend :  Unity.Event ,

    x : null,
    y : null,
    localPoint : null,
    touchMoveDetection : null,
    gesture : null,
    touch : null,

    setTouchMoveDetection : function(flag) {
        this.touchMoveDetection = flag;
    }

});

Ext.define('Unity.Touch', {

                
                      
                            
      

	enabled : true,

	canvasOffset : null,

	stage : null,

	canvas : null,

	touchMoveDetection : true,

	touchstartTarget : null,

	touchIdentifier : null,

	init : function(stage) {
		this.stage = stage;
		this.canvas = stage.canvas;
		this.canvasOffset = this.getCanvasOffset(this.canvas);
		this.initEvents();
	},

	enable : function() {
		this.enabled = true;
	},

	disable : function() {
		this.enabled = false;
	},

	getCanvasOffset : function(canvas) {
		var obj = canvas;
		var offset = { x : obj.offsetLeft, y : obj.offsetTop };
		while ( obj = obj.offsetParent ) {
			offset.x += obj.offsetLeft;
			offset.y += obj.offsetTop;
		}
		return offset;
	},

	initEvents : function() {
		var me = this;
		if(window.Hammer) {
			Hammer(me.canvas, {
				transform : false,
				doubletap : false,
				hold : false,
				rotate : false,
				pinch : false
			}).on('touch release tap swipe drag dragstart dragend', function(e) {
                me.enabled && me.onGestureEvent(e, e.type);
            });
		}
	},

	onGestureEvent : function(e, type) {
		var x, y, touchEvent, target, result;

		target = this.touchstartTarget;

		x = e.gesture.center.pageX;
		y = e.gesture.center.pageY;

		if(type === 'touch') {
			this.touchMoveDetection = true;
            result = this.stage.getUnderPoint(x, y, true);
			target = this.touchstartTarget = result && result.gameObject;
		} else if(type === 'release') {
            result = this.stage.getUnderPoint(x, y, true);
            target = result && result.gameObject;
		} else if(type === 'drag' && this.touchMoveDetection) {
            result = this.stage.getUnderPoint(x, y, true);
            target = result && result.gameObject;
		}

		if(this.touchstartTarget) {
			touchEvent = new Unity.GestureEvent({
				x : x,
				y : y,
                localPoint : result && result.localPoint,
				type : type,
				bubbles: true,
				touch: target,
				target : this.touchstartTarget,
				touchMoveDetection : false,
				gesture : e.gesture
			});
            this.dispatchGestureEvent(this.touchstartTarget, type, touchEvent);
			this.touchMoveDetection = touchEvent.touchMoveDetection;

			if(type === 'release' || Hammer.detection.stopped) {
				this.touchstartTarget = null;
			}
		}

	},

    dispatchGestureEvent : function(target, type, event) {
        target.fireEvent(type, event);
    }

});

Ext.define('Unity.TweenJSProxy', {

	tween : function(override) {
		return createjs.Tween.get(this, null, null, override);
	},

	clearTweens : function() {
		createjs.Tween.removeTweens(this);
	}

});

Ext.define('Unity.Transform', function(Transform) {

	var matrix;

	// copy from createjs
	var Matrix2D = function(a, b, c, d, tx, ty) {
		this.initialize(a, b, c, d, tx, ty);
	};

	var p = Matrix2D.prototype;
	Matrix2D.identity = null;
	Matrix2D.DEG_TO_RAD = Math.PI/180;
	p.a = 1;
	p.b = 0;
	p.c = 0;
	p.d = 1;
	p.tx = 0;
	p.ty = 0;
	p.alpha = 1;
	p.shadow  = null;
	p.compositeOperation = null;
	p.initialize = function(a, b, c, d, tx, ty) {
		this.a = (a == null) ? 1 : a;
		this.b = b || 0;
		this.c = c || 0;
		this.d = (d == null) ? 1 : d;
		this.tx = tx || 0;
		this.ty = ty || 0;
		return this;
	};
	p.prepend = function(a, b, c, d, tx, ty) {
		var tx1 = this.tx;
		if (a != 1 || b != 0 || c != 0 || d != 1) {
			var a1 = this.a;
			var c1 = this.c;
			this.a  = a1*a+this.b*c;
			this.b  = a1*b+this.b*d;
			this.c  = c1*a+this.d*c;
			this.d  = c1*b+this.d*d;
		}
		this.tx = tx1*a+this.ty*c+tx;
		this.ty = tx1*b+this.ty*d+ty;
		return this;
	};
	p.append = function(a, b, c, d, tx, ty) {
		var a1 = this.a;
		var b1 = this.b;
		var c1 = this.c;
		var d1 = this.d;

		this.a  = a*a1+b*c1;
		this.b  = a*b1+b*d1;
		this.c  = c*a1+d*c1;
		this.d  = c*b1+d*d1;
		this.tx = tx*a1+ty*c1+this.tx;
		this.ty = tx*b1+ty*d1+this.ty;
		return this;
	};
	p.prependMatrix = function(matrix) {
		this.prepend(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
		this.prependProperties(matrix.alpha, matrix.shadow,  matrix.compositeOperation);
		return this;
	};
	p.appendMatrix = function(matrix) {
		this.append(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
		this.appendProperties(matrix.alpha, matrix.shadow,  matrix.compositeOperation);
		return this;
	};
	p.prependTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
		if (rotation%360) {
			var r = rotation*Matrix2D.DEG_TO_RAD;
			var cos = Math.cos(r);
			var sin = Math.sin(r);
		} else {
			cos = 1;
			sin = 0;
		}

		if (regX || regY) {
			// append the registration offset:
			this.tx -= regX; this.ty -= regY;
		}
		if (skewX || skewY) {
			// TODO: can this be combined into a single prepend operation?
			skewX *= Matrix2D.DEG_TO_RAD;
			skewY *= Matrix2D.DEG_TO_RAD;
			this.prepend(cos*scaleX, sin*scaleX, -sin*scaleY, cos*scaleY, 0, 0);
			this.prepend(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
		} else {
			this.prepend(cos*scaleX, sin*scaleX, -sin*scaleY, cos*scaleY, x, y);
		}
		return this;
	};
	p.appendTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
		if (rotation%360) {
			var r = rotation*Matrix2D.DEG_TO_RAD;
			var cos = Math.cos(r);
			var sin = Math.sin(r);
		} else {
			cos = 1;
			sin = 0;
		}

		if (skewX || skewY) {
			// TODO: can this be combined into a single append?
			skewX *= Matrix2D.DEG_TO_RAD;
			skewY *= Matrix2D.DEG_TO_RAD;
			this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
			this.append(cos*scaleX, sin*scaleX, -sin*scaleY, cos*scaleY, 0, 0);
		} else {
			this.append(cos*scaleX, sin*scaleX, -sin*scaleY, cos*scaleY, x, y);
		}

		if (regX || regY) {
			// prepend the registration offset:
			this.tx -= regX*this.a+regY*this.c;
			this.ty -= regX*this.b+regY*this.d;
		}
		return this;
	};
	p.rotate = function(angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		var a1 = this.a;
		var c1 = this.c;
		var tx1 = this.tx;

		this.a = a1*cos-this.b*sin;
		this.b = a1*sin+this.b*cos;
		this.c = c1*cos-this.d*sin;
		this.d = c1*sin+this.d*cos;
		this.tx = tx1*cos-this.ty*sin;
		this.ty = tx1*sin+this.ty*cos;
		return this;
	};
	p.skew = function(skewX, skewY) {
		skewX = skewX*Matrix2D.DEG_TO_RAD;
		skewY = skewY*Matrix2D.DEG_TO_RAD;
		this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), 0, 0);
		return this;
	};
	p.scale = function(x, y) {
		this.a *= x;
		this.d *= y;
		this.c *= x;
		this.b *= y;
		this.tx *= x;
		this.ty *= y;
		return this;
	};
	p.translate = function(x, y) {
		this.tx += x;
		this.ty += y;
		return this;
	};
	p.identity = function() {
		this.alpha = this.a = this.d = 1;
		this.b = this.c = this.tx = this.ty = 0;
		this.shadow = this.compositeOperation = null;
		return this;
	};
	p.invert = function() {
		var a1 = this.a;
		var b1 = this.b;
		var c1 = this.c;
		var d1 = this.d;
		var tx1 = this.tx;
		var n = a1*d1-b1*c1;

		this.a = d1/n;
		this.b = -b1/n;
		this.c = -c1/n;
		this.d = a1/n;
		this.tx = (c1*this.ty-d1*tx1)/n;
		this.ty = -(a1*this.ty-b1*tx1)/n;
		return this;
	};
	p.isIdentity = function() {
		return this.tx == 0 && this.ty == 0 && this.a == 1 && this.b == 0 && this.c == 0 && this.d == 1;
	};
	p.transformPoint = function(x, y, pt) {
		pt = pt||{};
		pt.x = x*this.a+y*this.c+this.tx;
		pt.y = x*this.b+y*this.d+this.ty;
		return pt;
	};
	p.decompose = function(target) {
		// TODO: it would be nice to be able to solve for whether the matrix can be decomposed into only scale/rotation
		// even when scale is negative
		if (target == null) { target = {}; }
		target.x = this.tx;
		target.y = this.ty;
		target.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
		target.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);

		var skewX = Math.atan2(-this.c, this.d);
		var skewY = Math.atan2(this.b, this.a);

		if (skewX == skewY) {
			target.rotation = skewY/Matrix2D.DEG_TO_RAD;
			if (this.a < 0 && this.d >= 0) {
				target.rotation += (target.rotation <= 0) ? 180 : -180;
			}
			target.skewX = target.skewY = 0;
		} else {
			target.skewX = skewX/Matrix2D.DEG_TO_RAD;
			target.skewY = skewY/Matrix2D.DEG_TO_RAD;
		}
		return target;
	};
	p.reinitialize = function(a, b, c, d, tx, ty, alpha, shadow, compositeOperation) {
		this.initialize(a,b,c,d,tx,ty);
		this.alpha = alpha == null ? 1 : alpha;
		this.shadow = shadow;
		this.compositeOperation = compositeOperation;
		return this;
	};
	p.copy = function(matrix) {
		return this.reinitialize(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty, matrix.alpha, matrix.shadow, matrix.compositeOperation);
	};
	p.appendProperties = function(alpha, shadow, compositeOperation) {
		this.alpha *= alpha;
		this.shadow = shadow || this.shadow;
		this.compositeOperation = compositeOperation || this.compositeOperation;
		return this;
	};
	p.prependProperties = function(alpha, shadow, compositeOperation) {
		this.alpha *= alpha;
		this.shadow = this.shadow || shadow;
		this.compositeOperation = this.compositeOperation || compositeOperation;
		return this;
	};
	p.clone = function() {
		return (new Matrix2D()).copy(this);
	};
	p.toString = function() {
		return "[Matrix2D (a="+this.a+" b="+this.b+" c="+this.c+" d="+this.d+" tx="+this.tx+" ty="+this.ty+")]";
	};

	// this has to be populated after the class is defined:
	Matrix2D.identity = new Matrix2D();

	// 一个createjs类用于帮助从Transform到canvas的context中的transform参数
	matrix = new Matrix2D();

	return {

		mixins : {
			tween :  Unity.TweenJSProxy 
		},

		statics : {
			Matrix2D : Matrix2D
		},

		constructor : function(config) {
			this.x = 0;
			this.y = 0;
			this.regX = 0;
			this.regY = 0;
			this.rotation = 0;
			this.scaleX = 1;
			this.scaleY = 1;
			this.skewX = 0;
			this.skewY = 0;
			this.alpha = 1;
			this.relative = true;
			this.gameObject = config.gameObject;
		},

		/**
		 * Get the top parent of Transform
		 * @return {*}
		 */
		getRoot : function() {
			var o = this.gameObject;
			while(o && o._parent) {
				o = o._parent;
			}
			return o.transform;
		},

		/**
		 * 将一个坐标点从相对于当前Transform转换成全局的坐标点
		 * @param x
		 * @param y
		 * @return {*}
		 */
		localToGlobal : function(x, y, concatenatedMatrix) {
			var mtx;
			if(concatenatedMatrix) {
				matrix.copy(concatenatedMatrix);
				mtx = matrix;
			} else {
				mtx = this.getConcatenatedMatrix();
			}
			if (mtx == null) { return null; }
			mtx.append(1, 0, 0, 1, x, y);
			return { x : mtx.tx, y : mtx.ty };
		},

		/**
		 * 与localToGlobal相反
		 * @param x
		 * @param y
		 * @return {*}
		 */
		globalToLocal : function(x, y, concatenatedMatrix) {
			var mtx;
			if(concatenatedMatrix) {
				matrix.copy(concatenatedMatrix);
				mtx = matrix;
			} else {
				mtx = this.getConcatenatedMatrix();
			}
			if (mtx == null) { return null; }
			mtx.invert();
			mtx.append(1, 0, 0, 1, x, y);
			return { x : mtx.tx, y : mtx.ty };
		},

		/**
		 * 获取一个Matrix2D, 及联了所有它的parentTransform的属性, 通常很方便的用于转换坐标点
		 * @return {createjs.Matrix2D}
		 */
		getConcatenatedMatrix : function(resultMatrix) {
			var o = this;
			var mtx = resultMatrix || matrix;
			mtx.identity();
			while (o != null) {
				mtx.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY)
					.prependProperties(o.alpha);
				if(!o.relative) break;
				o = o.gameObject._parent;
				if(o) {
					o = o.transform;
				}
			}
			return mtx;
		},

		/**
		 * 获取当前Transform转换的Matrix2D
		 * @return {Matrix2D}
		 */
		getMatrix : function() {
			var o = this;
			return matrix.identity()
				.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY)
				.appendProperties(o.alpha);
		},

		/**
		 * 将当前的Transform应用到canvas的context上
		 * @param context CanvasContextRenderer2d
		 */
		updateContext : function(context, optimized) {
			var mtx, o=this;
			if(this.relative) {
				if(optimized && this.isOnlyTranslate()) {
					context.translate(this.x, this.y);
				} else {
					context.save();
					mtx = matrix.identity().appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
					context.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
				}
				context.globalAlpha *= o.alpha;
			} else {
				context.save();
				mtx = this.getAbsoluteMatrix();
				context.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
				context.globalAlpha = o.alpha;
			}
		},

		reupdateContext : function(context, optimized) {
			if(this.relative && optimized && this.isOnlyTranslate()) {
				context.translate(-this.x, -this.y);
				context.globalAlpha /= this.alpha;
			} else {
				context.restore();
			}
		},

		isOnlyTranslate : function() {
			if( this.scaleX === 1 &&
				this.scaleY === 1 &&
				this.rotation === 0 &&
				this.regX === 0 &&
				this.regY === 0 &&
				this.skewX === 0 &&
				this.skewX === 0) {
				return true;
			}
			return false;
		},

		getAbsoluteMatrix : function(mtx) {
			var o = this;
			mtx = mtx || matrix;
			mtx.identity()
				.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY)
				.prependProperties(o.alpha);
			return mtx;
		},

		applyTransform : function(transform) {
			this.x = transform.x;
			this.y = transform.y;
			this.regX = transform.regX;
			this.regY = transform.regY;
			this.scaleX = transform.scaleX;
			this.scaleY = transform.scaleY;
			this.rotation = transform.rotation;
			this.alpha = transform.alpha;
			this.skewX = transform.skewX;
			this.skewY = transform.skewY;
            this.relative = transform.relative;
		}
	}

});

Ext.define('Unity.assets.AssetsLoader', {

	singleton : 'true',

	baseURL : '',

	loading : false,

	loaders : {},

	loadQueue : [],

	assetsMap : {},

	loadingAssetsMap : {},

	assetsUsingCounter : {},

	registerLoader : function(loaderName, ctor) {
		this.loaders[loaderName] = ctor;
	},

	isLoaded : function(id) {
		return !!this.getItem(id);
	},

	getItem : function(id) {
		return this.assetsMap[id];
	},

	getRef : function(id) {
		var item = this.getItem(id);
		if(!item) {
			Ext.Error.raise('Illegal resource id: ' + id);
		}
		return Ext.create('Unity.assets.AssetReference', {
			item : item
		});
	},

	use : function(id) {
		var item = this.getItem(id);
		if(!item) return null;
		this.assetsUsingCounter[id] = this.assetsUsingCounter[id] || 0;
		this.assetsUsingCounter[id] ++;
		return item.result;
	},

	disuse : function(id) {
		var item, asset;
		if(this.assetsUsingCounter[id])
			this.assetsUsingCounter[id] --;

		item = this.assetsMap[id];
		if(this.assetsUsingCounter[id] === 0) {
			delete this.assetsMap[id];
			delete this.assetsUsingCounter[id];
			asset = item.result;
			if(this.loadingAssetsMap[id]) {
				return;
			}
			if(asset && asset.dispose && typeof asset.dispose === 'function') {
				asset.dispose();
			}
		}
	},

	load : function(params) {
		var i, len, item;
		var items = params.items;
		var baseURL = params.baseURL;
		var callback = params.onFinished;
		var onProgress = params.onProgress;
		if(!Ext.isArray(items)) {
			items = [items];
		}

		for(i=0,len=items.length; i<len; i++) {
			item = items[i];
			if(Ext.isString(item)) {
				item = {
					id : item,
					src : item
				};
			}
			if(!item.id) {
				item.id = item.src;
			}
			item.src = (baseURL || this.baseURL) + item.src;
			item.loader = this.matchLoader(item);
			if(!item.loader) {
				Ext.Error.raise('Cant found loader to resolve "' + item.id + '"');
			}
			this.loadingAssetsMap[item.id] = true;
			items[i] = item;
		}

		this.loadQueue.push({
			total : items.length,
			items : items,
			callback : callback,
			onProgress : onProgress
		});
		this.loadNext();
	},

	matchLoader : function(item) {
		var key, loader;
		var matched, matchLen = 0, nextMatchLen;

		for(key in this.loaders) {
			loader = this.loaders[key];
			if(!loader.isInstance) {
				loader = this.loaders[key] = new loader();
			}
			if('loader.' + item.type === key) {
				matched = loader;
				break;
			}
			nextMatchLen = loader.match(item.src);
			if(nextMatchLen > matchLen) {
				matchLen = nextMatchLen;
				matched = loader;
			}
		}
		return matched;
	},

	loadNext : function() {
		var me = this;
		var i, len, item, itemId, loadUnit, items, total, loadedResult, loadedCount, onProgress;

		if(this.loading || this.loadQueue.length === 0) return;
		this.loading = true;

		loadedResult = {};
		loadedCount = 0;
		loadUnit = this.loadQueue.shift();
		items = loadUnit.items;
		total = loadUnit.total;
		onProgress = loadUnit.onProgress;

		function loadedOne(itemId) {
			delete me.loadingAssetsMap[itemId];
			loadedResult[itemId] = true;
			loadedCount ++;
			onProgress && onProgress(itemId, loadedCount, total);
			if(loadedCount === total) {
				loadUnit.callback && loadUnit.callback();
				me.loading = false;
				me.loadNext();
			}
		}

		for(i=0,len=items.length; i<len; i++) {
			item = items[i];
			if(!item) {
				Ext.Error.raise('Load item is null');
			}
			itemId = item.id;
			if(this.assetsMap[itemId]) {
				loadedOne(itemId);
			} else {
				(function(item) {
					item.loader.load(item, function() {
						if(item.error) {
							console.log('load ', item.id, ' error: ' + item.error);
							loadedOne(item.id);
						} else {
							me.assetsMap[item.id] = item;
							loadedOne(item.id);
						}
					});
				})(item);
			}
		}

	},

	computeImageMemory : function() {
		var AsyncImage = Unity.assets.AsyncImage;
		var id, item, img;
		var size = 0;

		var get2Pow = function(width) {
			var base = 2;
			while(width > base) {
				base *= 2;
			}
			return base;
		};

		for(id in this.assetsMap) {
			item = this.assetsMap[id];
			if(item && item.result instanceof AsyncImage) {
				img = item.result.image;
				size += get2Pow(img.width) * get2Pow(img.height);
			}
		}
		return size*4/1024/1024;
	}

});

Ext.define('Unity.Component', {

	            
		                           
	  

	statics : {
		registry : {}
	},

	inheritableStatics : {
		isComponentClass : true
	},

	alias : 'unity.component.component',

	ctype : 'component',

	isComponent : true,

	/**
	 * attached game object of this component
	 * @readonly
	 */
	gameObject : null,

    _autoReleaseRefs : null,

	constructor : function(config) {
		Ext.apply(this, config);
        this._autoReleaseRefs = [];
	},

    init : function() {

    },

	destroy : function() {
		this.gameObject.clearListeners();
        this.releaseRefs();
	},

	getAssetRef : function(id) {
		return Unity.assets.AssetsLoader.getRef(id);
	},

    releaseOnDestroy : function(ref) {
        this._autoReleaseRefs.push(ref);
    },

    releaseRefs : function() {
        this._autoReleaseRefs.forEach(function(ref) {
            ref.release();
        });
        this._autoReleaseRefs = null;
    },

	onClassExtended : function(cls, data, hooks) {
		var alias = Unity.CTYPE_PREFIX + data.ctype;
		Ext.ClassManager.setAlias(cls, alias);
		Unity.Component.registry[data.ctype] = cls;

		// resolve configs property extend
		var configs = {
			props : []
		};
		var hasProp = {};
		var theCls = cls;
		var theProto = data;
		while(theCls !== Unity.Component) {
			var theConfigs = theProto.configs;
			if(theConfigs) {
				if(theConfigs.props) {
					theConfigs.props.forEach(function(propCfg) {
						if(!hasProp[propCfg.name]) {
							configs.props.push(propCfg);
							hasProp[propCfg.name] = true;
						}
					});
				}
				for(var pName in theConfigs) {
					if(!configs.hasOwnProperty(pName)) {
						configs[pName] = theConfigs[pName];
					}
				}
			}
			theCls = theCls.superclass.self;
			theProto = theCls.prototype;
		}
		data.configs = configs;
	},

	onClassMixedIn : function(cls) {
		if(cls.isComponentClass) {
			var sourceConfigs = this.prototype.configs;
			var distConfigs = cls.prototype.configs;
			var hasProp = {};
			distConfigs.props.forEach(function(propConfig) {
				hasProp[propConfig.name] = true;
			});
			sourceConfigs.props.forEach(function(propConfig) {
				if(!hasProp[propConfig.name]) {
					hasProp[propConfig.name] = true;
					distConfigs.props.push(propConfig);
				}
			});
			for(var pName in sourceConfigs) {
				if(!distConfigs.hasOwnProperty(pName)) {
					distConfigs[pName] = sourceConfigs[pName];
				}
			}
		}

	}

});

/**
 *  一个通用的游戏对象类，利用组合模式将组件组合进行实现不同的游戏行为。
 */
Ext.define('Unity.GameObject', {

	            
		                           
		                  
		                 
	  

    statics : {
        idCache : {},
        getById : function(id) {
            return this.idCache[id];
        }
    },

	extend :  Unity.AbstractGameObject ,

	alias : 'unity.component.gameobject',

	inited : false,

	active : true,

	visible : true,

	touchable : false,

	width : 0,

	height: 0,

	constructor : function() {
		this.callParent(arguments);
		this.transform = new Unity.Transform({ gameObject: this });
		this._components = new Ext.util.MixedCollection();
        this.data = {};

        this.clipCmp = null;

        this.updateIdCache();

        this._cacheCanvas = null;
        this._cacheContext = null;
        this._cached = false;
        this._cacheOffsetX = 0;
        this._cacheOffsetY = 0;
	},

    updateIdCache : function() {
        if(this.id) {
            Unity.GameObject.idCache[this.id] = this;
        }
    },

	/**
	 * 判断该object是否是激活的
	 * @param upWards 是否向上根据tree中的parent, ancients去判断
	 * @returns {Boolean}
	 */
	isActive : function(upWards) {
		if(upWards === false) {
			return this.active;
		}
		var active = true;
		var o = this;
		while(o) {
			active = active && o.active;
			if(!active) {
				return false;
			}
			o = o._parent;
		}
		return active;
	},

	/**
	 * set active
	 * @param active
	 */
	setActive : function(active) {
		this.active = active;
	},

	/**
	 * 判断该object是否可见
	 * @param upWards 是否向上根据tree中的parent, ancients去判断
	 * @returns {Boolean}
	 */
	isVisible : function(upWards) {
		if(upWards === false) {
			return this.visible;
		}
		var visible = true;
		var o = this;
		while(o) {
			visible = visible && o.visible;
			if(!visible) {
				return false;
			}
			o = o._parent;
		}
		return visible;
	},

	/**
	 * set visible
	 * @param visible
	 */
	setVisible : function(visible) {
		this.visible = visible;
	},

	setTouchable : function(touchable) {
		this.touchable = touchable;
	},

	getWidth : function() {
		return this.width;
	},

	getHeight : function() {
		return this.height;
	},

	setWidth : function(width) {
		this.width = width;
	},

	setHeight : function(height) {
		this.height = height;
	},

	addCmp : function(cmp) {
		cmp.gameObject = this;
        if(cmp.clip) {
            this.clipCmp = cmp;
        }
		return this._components.add(cmp);
	},

	getCmp : function(ctype, cname) {
        if(cname) {
            return this.findCmpBy(function(cmp) {
                if(cmp.cname === cname) {
                    return cmp;
                }
            });
        }
		return this.findCmpBy(function(cmp) {
            if(cmp.ctype === ctype) {
                return cmp;
            }
        });
	},

	getCmpByFeature : function(feature) {
		var cmp;
		this._components.each(function(component) {
			if(component[feature]) {
				cmp = component;
				return false;
			}
		});
		return cmp;
	},

	getCmps : function(ctype) {
		return this.queryCmpBy(function(cmp) {
			return cmp.ctype === ctype;
		});
	},

	findCmpBy : function(fn, scope) {
		return this._components.findBy(fn, scope);
	},

	queryCmpBy : function(fn, scope) {
		return this._components.filterBy(fn, scope);
	},

	removeCmp : function(cmp) {
		cmp.gameObject = null;
		return this._components.remove(cmp);
	},

    removeAllCmps : function() {
        this._components.clear();
    },

	callCmp : function(method, args) {
		this._components.each(function(cmp) {
			var func = cmp[method];
			func && func.apply(cmp, args);
		}, this);
	},

	callChildren : function(method, args) {
		this.each(function(child) {
			var func = child[method];
			func && func.apply(child, args);
		});
	},

    query : function(expr) {
        var args = expr.split(':');
        var paths = args[0].split('/');
        var ctype = args[1];
        var result = this;
        for(var i= 0,len=paths.length; i<len; i++) {
            result = result.child(paths[i]);
            if(!result) return;
        }
        if(result === this) {
            return null;
        }
        if(ctype) {
            result = result.getCmp(ctype);
        }
        return result;
    },

	init : function() {
		this.callCmp('init');
		this.callCmp('layout');
		this.callChildren('init');
		this.inited = true;
	},

	destroy : function(remove) {
		this.callCmp('destroy');
		this.callChildren('destroy', arguments);
		this.inited = false;
		remove && this.parent() && this.parent().remove(this);
        this.clear();
        this.clearListeners();
        this.removeAllCmps();
        this.uncache();
        this.data = {};
        if(this.id) {
            delete Unity.GameObject.idCache[this.id];
        }
	},

    removeMe : function(destroy) {
        this.callParent(arguments);
        if(destroy) {
            this.destroy();
        }
    },

	update : function(Time) {
        var i, items, compItems, item;

        compItems = this._components.items;
        for(i=compItems.length-1; i>=0; i--) {
            item = compItems[i];
            if(item.update) {
                item.update(Time);
            }
        }

        items = this.items;
        for(i=items.length-1; i>=0; i--) {
            item = items[i];
            if(item.inited && item.active) {
                item.update(Time);
            }
        }
	},

	draw : function(context, gl) {
		this.transform.updateContext(context);
        if(this._cacheCanvas) {
            if(!this._cached) {
                this.doCache();
            }
            context.drawImage(this._cacheCanvas, 0, 0);
        } else {
            this.doDraw(context, gl);
        }
		this.transform.reupdateContext(context);
	},

	doDraw : function(context, gl) {
        var i, len, items, compItems, item;
        if(this.clipCmp) {
            this.clipCmp.clip(context);
        }
        compItems = this._components.items;
        for(i=0,len=compItems.length; i<len; i++) {
            item = compItems[i];
            if(item.draw) {
                item.draw(context, gl);
            }
        }
        items = this.items;
        for(i=0,len=items.length; i<len; i++) {
            item = items[i];
            if(item.inited && item.active && item.visible && item.draw) {
                item.draw(context, gl);
            }
        }
	},

	testHit : function(x, y) {
		var hit = false, hitDelegate;
		if(!this.isActive(true) || !this.isVisible(true)) {
			return hit;
		}
		hitDelegate = this.getCmpByFeature(Unity.TESTHIT);
		return hitDelegate && hitDelegate.testHit(x, y);
	},

	getUnderPoint : function(x, y, touchable, testHit) {
		var found, localP, child;
		if(this.getCount() > 0) {
			for(var i=this.items.length-1; i>=0; i--) {
				child = this.items[i];
				found = child.getUnderPoint(x, y, touchable, testHit);
				if(found) {
					return found;
				}
			}
		}

		if(!touchable || this.touchable) {
			localP = this.transform.globalToLocal(x, y);
			if(testHit) {
				if(testHit(this, localP.x, localP.y)) {
					return {
                        gameObject: this,
                        localPoint : localP
                    };
				}
			}
			else if(this.testHit(localP.x, localP.y)) {
				return {
                    gameObject: this,
                    localPoint : localP
                };
			}
		}
		return null;
	},

	/**
	 * @private
	 * @param loader an proxy loader for load
	 */
	loadAssets : function(loader) {
		this.callCmp('loadAssets', [loader]);
		this.callChildren('loadAssets', [loader]);
	},

    cache : function(x, y, width, height) {
        if(this._cacheCanvas && (this._cacheCanvas.width !== width || this._cacheCanvas.height !== height)) {
            this.uncache();
        }
        if(!this._cacheCanvas) {
            this._cacheCanvas = Unity.createCanvas(width, height);
        }
        this._cacheOffsetX = x;
        this._cacheOffsetY = y;
        this._cacheContext = this._cacheCanvas.getContext('2d');
        this._cached = false;
    },

    updateCache : function(offsetX, offsetY) {
        this._cached = false;
        this._cacheOffsetX = offsetX || this._cacheOffsetX;
        this._cacheOffsetY = offsetY || this._cacheOffsetY;
    },

    translateCache : function(deltaX, deltaY) {
        this._cached = false;
        this._cacheOffsetX += deltaX;
        this._cacheOffsetY += deltaY;
    },

    uncache : function() {
        if(this._cacheCanvas) {
            this._cacheContext.dispose && this._cacheContext.dispose();
            this._cacheCanvas.dispose && this._cacheCanvas.dispose();
            this._cacheCanvas = null;
        }
        this._cached = false;
    },

    doCache : function() {
        var cacheContext = this._cacheContext;
        cacheContext.clearRect(0, 0, this._cacheCanvas.width, this._cacheCanvas.height);
        cacheContext = this._cacheContext;
        cacheContext.translate(-this._cacheOffsetX, -this._cacheOffsetY);
        this.doDraw(cacheContext);
        cacheContext.translate(this._cacheOffsetX, this._cacheOffsetY);
        this._cached = true;
    }

});

Ext.define('Unity.Stage', function() {

	var requestAnimationFrame =
		window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			function(frameCall, intervalTime) {
				setTimeout(frameCall, intervalTime);
			};

	return {

		            
			             
			             
		  

		extend :  Unity.GameObject ,

		isStage : true,

		alias : 'stage',

		/**
		 * @cfg {HTMLCanvasElement} canvas
		 */
		canvas : undefined,

		/**
		 * @cfg {Boolean} autoClear
		 */
		autoClear : true,

		/**
		 *  @cfg {Boolean} backgroundColor
		 */
		backgroundColor: '#000000',

        speed : 1,

        webgl : false,
		context : null,
        gl : null,

		state : 'stop',

		width : null,

		height : null,

		touch : null,

        viewport: {
            x : 0,
            y : 0,
            width : 0,
            heihgt : 0
        },

        schedules : {},
        scheduleCount : 0,

		constructor : function(config) {
			this.callParent(arguments);
			this.name = 'UnityStage';
			this.width = config.width || this.canvas.width;
			this.height = config.height || this.canvas.height;
			if(this.width !== this.canvas.width) {
				this.canvas.width = this.width;
			}
			if(this.height !== this.canvas.height) {
				this.canvas.height = this.height;
			}
			this.initContext();

			this.touch = new Unity.Touch();
			this.touch.init(this);

			this.init();
		},

		initContext : function() {
			this.context = this.canvas.getContext('2d', {
                antialias : true
            });
            //try 'experimental-webgl'
            if(this.webgl) {
                this.enableWebGL();
            }
		},

        enableWebGL : function() {
            try {
                this.gl = this.canvas.getContext('experimental-webgl',  this.options);
            } catch (e) {
                //try 'webgl'
                try {
                    this.gl = this.canvas.getContext('webgl',  this.options);
                } catch (e2) {
                    // fail, not able to get a context
                    console.error(' This browser does not support webGL. Try using the canvas renderer' + this);
                }
            }
        },

		draw : function(context, gl) {
			if(this.autoClear) {
				if(this.backgroundColor) {
					this.context.fillStyle = this.backgroundColor;
					this.context.fillRect(0, 0, this.width, this.height);
				} else {
					this.context.clearRect(0, 0, this.width, this.height);
				}
			}
            this.viewport.x = -this.transform.x;
            this.viewport.y = -this.transform.y;
            this.viewport.width = this.width;
            this.viewport.height = this.height;
			this.callParent(arguments);
		},

		resize : function(width, height) {
			this.canvas.width = width;
			this.canvas.height = height;
			this.width = width;
			this.height = height;
		},

		runStep : function(delta) {
            var scheduleId, scheduleItem;
			var Time = Unity.Time;
            if(this.inited && this.active) {
                this.update(delta || Time.delta);
                if(this.visible) {
                    this.draw(this.context, this.gl);
                }
            }
            for(scheduleId in this.schedules) {
                scheduleItem = this.schedules[scheduleId];
                if(scheduleItem.isFrame) {
                    scheduleItem.frame --;
                    if(scheduleItem.frame < 0) {
                        scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                        delete this.schedules[scheduleId];
                    }
                }
                if(scheduleItem.isTime) {
                    scheduleItem.time -= Time.delta;
                    if(scheduleItem.time < 0) {
                        scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                        delete this.schedules[scheduleId];
                    }
                }
            }
		},

		start : function() {
			var me = this;
			var frame;
			var Time = Unity.Time;
			me.state = 'running';
			Time.reset();

			frame = function() {
				if(me.state === 'stop') return false;
				Time.update(me.speed);
				if(me.state === 'running') {
					me.runStep();
					window.createjs && createjs.Tween && createjs.Tween.tick(Time.delta);
				}
				requestAnimationFrame(frame);
			};

			requestAnimationFrame(frame);
		},

		stop : function() {
			this.state = 'stop';
		},

		pause : function() {
			this.state = 'pause';
		},

		resume : function() {
			this.state = 'running';
		},

        schedule : function(task, frame, args) {
            frame = frame || 0;
            this.schedules['Schedule_' + (this.scheduleCount++)] = {
                task : task,
                frame : frame,
                args : args,
                isFrame : true
            };
        },

        scheduleTime : function(task, time, args) {
            time = time || 0;
            this.schedules['Schedule_' + (this.scheduleCount++)] = {
                task : task,
                time : time,
                args : args,
                isTime : true
            };
        }
	}
});


/**

 {
 	"name": "clickEffect",
 	"alias" : "gameobject",
	"id": "root",
	"active": true,
	"visible": true,
	"touchable": false,
	"width": 0,
	"height": 0,
	"components": [{
		"alias" : "c-image",
		"config" : {}
	}],
	"transform": {
		"x": 0,
		"y": 0,
		"regX": 0,
		"regY": 0,
		"scaleX": 1,
		"scaleY": 1,
		"skewX": 0,
		"skewY": 0,
		"rotation": 0,
		"alpha": 1
	},
	"children": [
	]
 }

 */
Ext.define('Unity.Builder', {

	singleton : true,

    deepCopy : function(o) {
        var copy = o,k;

        if (o && typeof o === 'object') {
            copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
            for (k in o) {
                copy[k] = this.deepCopy(o[k]);
            }
        }

        return copy;
    },

    loadGameObject : function(params) {
        var me = this;
        var fileSrc = params.file;
        var beforeLoadAssets = params.beforeLoadAssets || function(gameObject, callback) {
            callback();
        };
        var beforeInit = params.beforeInit || function(gameObject, callback) {
            callback();
        };
        var onFinished = params.onFinished;
        var onProgress = params.onProgress;
        me.loadGameObjectFile(fileSrc, function(data) {
            me.buildGameObject(data.objects, function(gameObj) {
                beforeLoadAssets(gameObj, function() {
                    me.loadAssets(gameObj, function() {
                        beforeInit(gameObj, function() {
                            gameObj.init();
                            onFinished && onFinished(gameObj);
                        });
                    }, onProgress);
                });
            });
        });
    },

    loadGameObjectFile : function(fileSrc, callback) {
        var Loader = Unity.assets.AssetsLoader;
        Loader.load({
            items : [{
                src : fileSrc,
                type : 'json'
            }],
            onFinished : function() {
                callback && callback(Loader.getItem(fileSrc).result);
            }
        });
    },

    loadAssets : function(gameObj, callback, onProgress) {
        var assets;
        var collector = new Unity.assets.AssetsCollector();
        gameObj.loadAssets(collector);
        assets = collector.getCollected();
        if(assets.length === 0) {
            callback && callback();
        } else {
            Unity.assets.AssetsLoader.load({
                items : collector.getCollected(),
                onProgress: onProgress,
                onFinished : function() {
                    collector.onload();
                    callback && callback();
                }
            });
        }
    },

	buildGameObject : function(objData, onFinished) {
        if(objData.name.charAt(0) === Unity.NESTED_OFILE_PREFIX) {
            this.buildNestedOFileGameObject(objData, onFinished);
        } else {
            this.buildNormalGameObject(objData, onFinished);
        }
	},

    buildNestedOFileGameObject : function(objData, onFinished) {
        var me = this;
        var nestedOFileURL = objData.name.substr(1);
        var Loader = Unity.assets.AssetsLoader;
        Loader.load({
            items: [
                {
                    src: nestedOFileURL,
                    type: 'json'
                }
            ],
            onFinished: function () {
                me.buildGameObject(Loader.getItem(nestedOFileURL).result.objects, function(gameObj) {
                    me.buildNormalGameObject(objData, function(nextedParent) {
                        nextedParent.add(gameObj);
                        onFinished && onFinished(nextedParent);
                    });
                });
            }
        });
    },

    createGameObject : function(objData) {
        var alias = objData.alias || 'gameobject';
        return Unity.create(alias, {
            id : objData.gid,
            name : objData.name
        });
    },

    resolveObjectData : function(objData) {
        return this.deepCopy(objData);
    },

    buildNormalGameObject : function(objData, onFinished) {
        var me = this;
        var gameObj = this.createGameObject(objData);

        objData = this.resolveObjectData(objData);

        gameObj.active = objData.active;
        gameObj.visible = objData.visible;
        gameObj.touchable = objData.touchable;
        gameObj.width = objData.width;
        gameObj.height = objData.height;

        gameObj.tags = objData.tags;

        var tagHash = {};
        gameObj.tagHash = tagHash;
        gameObj.tags && gameObj.tags.split(' ').forEach(function(tag) {
            tagHash[tag] = true;
        });

        gameObj.transform.applyTransform(objData.transform);

        objData.components.forEach(function(cmpData) {
            var cmp = me.buildComponent(cmpData);
            if(cmp) {
                gameObj.addCmp(cmp);
            }
        });

        function queueBuildChild() {
            var childObjData = objData.children.shift();
            if(!childObjData) {
                onFinished && onFinished(gameObj);
                return;
            }
            me.buildGameObject(childObjData, function(child) {
                gameObj.add(child);
                queueBuildChild();
            });
        }

        queueBuildChild();
    },

	buildComponent : function(cmpData) {
		var alias = cmpData.alias;
		var component = Unity.create(alias, cmpData.config);
		return component;
	}

});

Ext.define('Unity.assets.AssetReference', {

	            
		                           
	  

	item : null,

	asset : null,

	constructor : function(config) {
		Ext.apply(this, config);
		this.asset = this.item.result;
		Unity.assets.AssetsLoader.use(this.item.id);
	},

	release : function() {
		Unity.assets.AssetsLoader.disuse(this.item.id);
		this.item = null;
	},

	get : function() {
		return this.asset;
	}

});

Ext.define('Unity.assets.AssetsCollector', {

	            
		                           
		                           
	  

	collection : null,

	constructor : function() {
		this.collection = new Ext.util.MixedCollection();
	},

	load : function(itemOrSrc, callback) {
		var callbacks = this.collection.get(itemOrSrc);
		if(callbacks) {
			callbacks.push(callback);
		} else {
			callbacks = [callback];
		}
		this.collection.add(itemOrSrc, callbacks);
	},

	loadAll : function(items, callback) {
		var me = this;
		items.forEach(function(item) {
			me.load(item, callback);
		});
	},

	getCollected : function() {
		var collected = [];
		this.collection.eachKey(function(itemOrSrc) {
			collected.push(itemOrSrc);
		});
		return collected;
	},

	onload : function() {
		var AssetsLoader = Unity.assets.AssetsLoader;
		this.collection.eachKey(function(itemOrSrc, callbacks) {
			if(AssetsLoader.isLoaded(itemOrSrc)) {
				callbacks.forEach(function(callback) {
					var ref = AssetsLoader.getRef(itemOrSrc);
					callback && callback(ref, itemOrSrc);
				});
			}
		}, this);
	}

});

Ext.define('Unity.assets.AsyncImage', {

	/**
	 * @cfg {String} resourceId
	 */

	/**
	 * @cfg {Image} image
	 */

	constructor : function(config) {
		Ext.apply(this, config);
		this.src = this.image.src;
	},

	draw : function(context, a, b, c, d, e, f, g, h) {
		// slice 性能差, 用最大参数数目优化
		//var args = Ext.Array.slice(arguments, 1);
		var image = this.image;
		var argsLen = arguments.length;
		if(image) {
			if(argsLen === 3) {
				context.drawImage(image, a || 0, b || 0);
			} if(argsLen === 5) {
				context.drawImage(image, a, b, c, d);
			} if(argsLen === 7) {
				context.drawImage(image, a, b, c, d, e, f);
			} else {
				context.drawImage(image, a, b, c, d, e, f, g, h);
			}
		}
	},

	drawAs9Grid : function(context, region, grid, x, y, width, height) {
		if(!region || !grid || !width || !height) return;
		var rx = region.x;
		var ry = region.y;
		var ow = region.w;
		var oh = region.h;
		var gl = grid.left;
		var gr = grid.right;
		var gt = grid.top;
		var gb = grid.bottom;
		var ctx = context;
		// top left
		this.draw(context, rx, ry, gl, gt,
			x, y, gl, gt);

		// top
		this.draw(context, rx + gl, ry + 0, ow- gl- gr, gt,
			x + gl, y, width- gl- gr, gt);

		// top right
		this.draw(context, rx + ow- gr, ry + 0, gr, gt,
			x + width- gr, y, gr, gt);

		// left
		this.draw(context, rx + 0, ry + gt, gl, oh - gt - gb,
			x, y + gt, gl, height - gt - gb);

		// left bottom
		this.draw(context, rx + 0, ry + oh - gb, gl, gb,
			x, y + height-gb, gl, gb);

		// bottom
		this.draw(context, rx + gl, ry + oh-gb, ow- gl- gr, gb,
			x + gl, y + height- gb, width- gl- gr, gb);

		// right bottom
		this.draw(context, rx + ow- gr, ry + oh - gb, gr, gb,
			x + width- gr, y + height-gb, gr, gb);

		// right
		this.draw(context, rx + ow- gr, ry + gt, gr, oh- gt -gb,
			x + width- gr, y + gt, gr, height- gt-gb);

		// center
		this.draw(context, rx + gl, ry + gt, ow- gl-gr, oh- gt -gb,
			x + gl, y + gt, width- gl- gr, height- gt-gb);
	},

	draw3in1 : function(context, region, splitCoords, widths, x, y) {
		if(!region || !splitCoords || !widths || splitCoords.length !== 2 || widths.length !== 3) return;
		var rx = region.x;
		var ry = region.y;
		var ow = region.w;
		var oh = region.h;

		this.draw(context,
			rx, ry, splitCoords[0], oh,
			x, y, widths[0], oh);
		this.draw(context,
			rx+splitCoords[0], ry, splitCoords[1] - splitCoords[0], oh,
			x + widths[0], y, widths[1], oh);
		this.draw(context,
			rx+splitCoords[1], ry, ow-splitCoords[1], oh,
			x + widths[0] + widths[1], y, widths[2], oh);
	},

	dispose : function(temporary) {
		this.image && this.image.dispose && this.image.dispose();
		this.image = null;
	}

});

Ext.define('Unity.assets.Texture', {
	
	extend :  Unity.assets.AsyncImage ,

	/**
	 * @cfg {Object} frames
	 */

	getFrame : function(name) {
		var frameData = this.frames[name];
		if(frameData) {
			return frameData.frame;
		}
		return null;
	},

	getSpriteSourceSize : function(name) {
		var frameData = this.frames[name];
		if(frameData) {
			return frameData.spriteSourceSize;
		}
		return null;
	},

	drawFrame : function(context, name, x, y, w, h) {
		var f = this.getFrame(name);
		if(f) {
			this.draw(context, f.x, f.y, f.w, f.h, x||0, y||0, w||f.w, h||f.h);
		}
	},

	drawFrameAs9Grid : function(context, name, grid, x, y, width, height) {
		var f = this.getFrame(name);
		if(f) {
			this.drawAs9Grid(context, f, grid, x, y, width, height);
		}
	},

	drawFrameAs3in1 : function(context, name, splitCoords, widths, x, y) {
		var f = this.getFrame(name);
		if(f) {
			this.draw3in1(context, f, splitCoords, widths, x, y);
		}
	}

});

Ext.define('Unity.assets.Loader', {

	                                        

	match : function(url) {
		throw new Error('abstract method');
	},

	load : function(item, callback) {
		throw new Error('abstract method');
	},

	onClassExtended : function(cls, data, hooks) {
		Unity.assets.AssetsLoader.registerLoader(data.alias || data.$className, cls);
	}

});

Ext.define('Unity.assets.StringLoader', {

	extend :  Unity.assets.Loader ,

	alias : 'loader.string',

	load : function(item, callback) {
		Ext.Ajax.request({
			url : item.src,
			time : 5000,
			success : function(response) {
				var data = response.responseText;
				item.result = data;
				callback && callback();
			},
			failure: function(response) {
				if(response.status === 0 && response.responseText) {
					var data = response.responseText;
					item.result = data;
					callback && callback();
					return;
				}
                Ext.Ajax.request({
                    url : item.src,
                    time : 5000,
                    success : function(response) {
                        var data = response.responseText;
                        item.result = data;
                        callback && callback();
                    },
                    failure: function(response) {
                        if(response.status === 0 && response.responseText) {
                            var data = response.responseText;
                            item.result = data;
                            callback && callback();
                            return;
                        }
                        item.error = true;
                        callback && callback();
                    }
                });
			}
		});
	},

	match : function(url) {
		return 0.001;
	}

});

Ext.define('Unity.assets.ImageLoader', {

	extend :  Unity.assets.Loader ,

	alias : 'loader.image',

	load : function(item, callback) {
		var image = new Image();
		image.src = item.src;
		image.onload = function() {
			item.result = new Unity.assets.AsyncImage({
				resourceId : item.id,
				image : image
			});
			callback && callback();
		};
		image.onerror = function() {
			item.error = true;
			callback && callback();
		};
	},

	match : function(url) {
		if(Ext.String.endsWith(url, '.gif') ||
			Ext.String.endsWith(url, '.png') ||
			Ext.String.endsWith(url, '.jpg') ||
            Ext.String.startsWith(url, 'data:image/')) {
			return 4;
		}
		return 0;
	}

});

Ext.define('Unity.assets.JSONLoader', {

	extend :  Unity.assets.Loader ,

	alias : 'loader.json',

    loadJSON : function(jsonSrc, callback) {
        Ext.Ajax.request({
            url : jsonSrc,
            time : 5000,
            success : function(response) {
                var data = JSON.parse(response.responseText);
                callback && callback(data);
            },
            failure: function(response) {
                if(response.status === 0 && response.responseText) {
                    var data = JSON.parse(response.responseText);
                    callback && callback(data);
                    return;
                }
                Ext.Ajax.request({
                    url: jsonSrc,
                    time: 5000,
                    success: function (response) {
                        var data = JSON.parse(response.responseText);
                        callback && callback(data);
                    },
                    failure: function (response) {
                        if (response.status === 0 && response.responseText) {
                            var data = JSON.parse(response.responseText);
                            callback && callback(data);
                            return;
                        }
                        callback && callback();
                    }
                });
            }
        });
    },

	load : function(item, callback) {
		this.loadJSON(item.src, function(data) {
            item.error = !data;
            item.result = data;
            callback && callback();
        });
	},

	match : function(url) {
		if(Ext.String.endsWith(url, '.json')) {
			return 5;
		}
		return 0;
	}

});

Ext.define('Unity.assets.TextureLoader', {
	
	            
		                      
	  

	extend :  Unity.assets.Loader ,

	alias : 'loader.texture',

    loadJson : function(jsonSrc, callback) {
        Ext.Ajax.request({
            url : jsonSrc,
            timeout : 5000,
            success : function(response) {
                var data = JSON.parse(response.responseText);
                callback && callback(data);
            },
            failure: function(response) {
                if(response.status === 0 && response.responseText) {
                    var data = JSON.parse(response.responseText);
                    callback && callback(data);
                    return;
                }
                Ext.Ajax.request({
                    url : jsonSrc,
                    timeout : 5000,
                    success : function(response) {
                        var data = JSON.parse(response.responseText);
                        callback && callback(data);
                        callback && callback();
                    },
                    failure: function(response) {
                        if(response.status === 0 && response.responseText) {
                            var data = JSON.parse(response.responseText);
                            callback && callback(data);
                            return;
                        }
                        callback && callback();
                    }
                });
            }
        });
    },

	load : function(item, callback) {
        var me = this;
		var image, imageSrc;
		var jsonSrc = item.src;
		if(!imageSrc && jsonSrc) {
			imageSrc = item.imageSrc = jsonSrc.replace('.tt.json', '.tt.png');
		}
		image = new Image();
		image.src = imageSrc;
		image.onload = function() {
            me.loadJson(jsonSrc, function(data) {
                if(!data) {
                    image.dispose && image.dispose();
                    item.error = true;
                } else {
                    item.result = new Unity.assets.Texture({
                        resourceId: item.id,
                        image: image,
                        frames: data.frames
                    });
                }
                callback && callback();
            });
		};
		image.onerror = function() {
			item.error = true;
			callback && callback();
		};
	},

	match : function(url) {
		if(Ext.String.endsWith(url, '.tt.png') || Ext.String.endsWith(url, '.tt.json')) {
			return 7;
		}
		return 0;
	}

});

Ext.define('Unity.cmp.Controller', {

	extend :  Unity.Component ,

	ctype : 'Framework_Controller',

	configs : {
		props : [{
			name : 'scriptSrc',
			type : 'string',
			defaultValue : '',
			provider : 'script'
		}]
	},

	scriptLoaded : false,

	script : null,

	init : function() {
		if(this.script) {
			eval(this.script);
		}
	},

	loadAssets : function(loader) {
		var me = this;
		if(!me.scriptLoaded) {
			if(me.scriptSrc) {
				loader.load(me.scriptSrc, function(ref) {
					me.script = ref.get();
					me.scriptLoaded = true;
				});
			}
		}
	}

});

Ext.define('Unity.cmp.Alignable', {

	extend :  Unity.Component ,

	ctype : 'Framework_Alignable',

	configs : {
		props : [{
			name : 'baseline',
			type : 'string',
			defaultValue : '',
			provider : {
				id : 'combobox',
				items : [
					'top',
					'middle',
					'bottom'
				]
			}
		}, {
			name : 'align',
			type : 'string',
			defaultValue : '',
			provider : {
				id : 'combobox',
				items : [
					'start',
					'center',
					'end'
				]
			}
		}]
	},

	alignX : 0,

	alignY : 0,

	getAlignWidth : function() {
		return 0;
	},

	getAlignHeight : function() {
		return 0;
	},

	setBaseline : function(baseline) {
		this.baseline = baseline;
		this.updateAlignPosition();
	},

	setAlign : function(align) {
		this.align = align;
		this.updateAlignPosition();
	},

	updateAlignPosition : function() {
		var x, y, width, height;

		height = this.getAlignHeight();
		width = this.getAlignWidth();

		if(this.baseline == 'top') y = 0;
		else if(this.baseline == 'middle') y = -height/2;
		else if(this.baseline == 'bottom') y = -height;
		else y = 0;

		if(this.align == 'start') x = 0;
		else if(this.align == 'center') x = -width/2;
		else if(this.align == 'end') x = -width;
		else x = 0;

		this.alignX = x;
		this.alignY = y;
	}

});

Ext.define('Unity.cmp.Text', {

	extend :  Unity.Component ,

	mixins : [
		 Unity.cmp.Alignable 
	],

	ctype : 'Framework_Text',

	configs : {
		props : [{
			name : 'text',
			type : 'string',
			defaultValue : ''
		}, {
			name : 'color',
			type : 'string',
			defaultValue: '#000000'
		}, {
			name : 'font',
			type : 'string',
			defaultValue: 'bold 18px Helvetica,黑体'
		}, {
			name : 'shadowColor',
			type : 'string',
			defaultValue : '#000000'
		}, {
			name : 'shadowOffsetX',
			type : 'int',
			defaultValue : 0
		}, {
			name : 'shadowOffsetY',
			type : 'int',
			defaultValue : 2
		}, {
			name : 'cacheAsImage',
			type : 'boolean',
			defaultValue : true
		}]
	},

	destroy : function() {
        this.callParent(arguments);
		if(this.cacheCanvas) {
			this.cacheCanvas.dispose && this.cacheCanvas.dispose();
			this.cacheContext.dispose && this.cacheContext.dispose();
			this.cacheCanvas = null;
			this.cacheContext = null;
		}
	},

	applyTextParamsToContext : function(context) {
		if(this.font && this.font !== context.font) {
			context.font = this.font;
		}
		if(this.baseline && this.baseline !== context.textBaseline) {
			context.textBaseline = this.baseline;
		}
		if(this.align && this.align !== context.textAlign) {
			context.textAlign = this.align;
		}
	},

	applyColorToContext : function(context) {
		if(this.color && context.fillStyle !== this.color) {
			context.fillStyle = this.color;
		}
	},

	draw : function(context) {
		if(this.text) {
			if(this.cacheAsImage) {
				this.cache(context);
				this.drawCache(context);
			} else {
				this.drawText(context);
			}
		}
	},

	drawText : function(context) {
		this.applyTextParamsToContext(context);
		this.drawShadow(context);
		this.applyColorToContext(context);
		context.fillText(this.text, 0, 0);
	},

	drawShadow : function(context) {
		if(this.shadowColor) {
			context.fillStyle = this.shadowColor;
			context.fillText(this.text, this.shadowOffsetX, this.shadowOffsetX);
		}
	},

	drawCache : function(context) {
		context.drawImage(this.cacheCanvas, this.alignX, this.alignY);
	},

	getTextHeight : function(font) {
		return parseInt(/(\d{1,3})px/.exec(font)[1]) + 2;
	},

	getAlignWidth : function() {
		return this.cacheWidth;
	},

	getAlignHeight : function() {
		return this.cacheHeight;
	},

	cache : function(stageContext) {
		if(!this.text) {
			this.cacheCanvas.dispose && this.cacheCanvas.dispose();
			this.cacheContext.dispose && this.cacheContext.dispose();
			this.cacheCanvas = null;
			this.cacheContext = null;
			this.cacheWidth = 0;
			this.cacheHeight = 0;
			this.updateAlignPosition();
			return;
		}
		else if(this.text && (!this.cacheText || this.cacheText !== this.text)) {
			if(this.font && this.font !== stageContext.font) {
				stageContext.font = this.font;
			}
			var measured = stageContext.measureText(this.text);
			var textHeight = this.getTextHeight(this.font);
			this.cacheCanvas = Unity.createCanvas(measured.width, textHeight);
			this.cacheWidth = measured.width;
			this.cacheHeight = textHeight;
			this.cacheContext = this.cacheCanvas.getContext('2d');
			if(this.font) {
				this.cacheContext.font = this.font;
			}
			this.cacheContext.textBaseline = 'middle';
			this.cacheContext.textAlign = 'left';
			if(this.shadowColor) {
				this.cacheContext.fillStyle = this.shadowColor;
				this.cacheContext.fillText(this.text, this.shadowOffsetX, this.shadowOffsetY + this.cacheHeight/2);
			}
			if(this.color) {
				this.cacheContext.fillStyle = this.color;
			}
			this.cacheContext.fillText(this.text, 0, this.cacheHeight/2);
			this.cacheText = this.text;
			this.updateAlignPosition();
		}
	}

});

Ext.define('Unity.cmp.Image', {

	extend :  Unity.Component ,

	mixins : [
		 Unity.cmp.Alignable 
	],

	ctype : 'Framework_Image',

    cname : 'image',

	configs : {
		props : [{
			name : 'imageSrc',
			type : 'string',
			defaultValue : '',
			provider : 'image'
		}, {
            name : 'webgl',
            type : 'boolean',
            defaultValue: false
        }]
	},

	imageRef : null,

	image : null,

	imageLoaded : false,

    vertexShaderSource : [
        'attribute vec2 a_position;',
        'void main() {',
            'gl_Position = vec4(a_position, 0, 1);',
        '}'
    ].join(''),

    fragmentShaderSource : [
        'void main() {',
            'gl_FragColor = vec4(0,1,0,1);',
        '}'
    ].join(''),

	init : function() {
        this.callParent(arguments);
		this.updateAlignPosition();
	},

	draw : function(context, gl) {
		if(this.image) {
            if(gl && this.webgl) {

            } else {
                this.image.draw(context, this.alignX, this.alignY);
            }
		}
	},

	setSrc : function(src) {
        if(this.imageSrc === src) {
            return;
        }
		this.imageLoaded = false;
		this.imageRef && this.imageRef.release();
		this.imageRef = null;
		this.image = null;
        this.imageSrc = src;
	},

	loadAssets : function(loader) {
		var me = this;
		if(!me.imageLoaded) {
			if(me.imageSrc) {
				loader.load(me.imageSrc, function(ref) {
					me.imageRef = ref;
					me.image = ref.get();
                    me.updateAlignPosition();
					me.imageLoaded = true;
				});
			}
		}
	},

	getAlignWidth : function() {
        if(!this.image) return 0;
		return this.image.image.width;
	},

	getAlignHeight : function() {
        if(!this.image) return 0;
		return this.image.image.height;
	},

	destroy : function() {
		this.callParent(arguments);
		this.imageRef && this.imageRef.release();
		this.imageRef = null;
		this.image = null;
	}

});

Ext.define('Unity.cmp.RectPattern', {

    extend :  Unity.cmp.Image ,

    ctype : 'Framework_RectPattern',

    configs : {
        props : [{
            name : 'rect',
            type : 'auto',
            defaultValue : {
                x : 0,
                y : 0,
                width : 0,
                height : 0
            },
            provider : 'rect'
        }, {
            name : 'repeat',
            type : 'string',
            defaultValue : 'repeat',
            provider : {
                id : 'combobox',
                items : [
                    'repeat',
                    'repeat-x',
                    'repeat-y'
                ]
            }
        }]
    },

    pattern : null,

    init : function() {
        this.callParent();
    },

    draw : function(context) {
        if(this.image) {
            this.pattern = context.createPattern(this.image.image, this.repeat);
            context.fillStyle = this.pattern;
            context.beginPath();
            context.rect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
            context.fill();
        }
    }

});

Ext.define('Unity.cmp.ColorMask', {

    extend:  Unity.Component ,

    ctype: 'Framework_ColorMask',

    configs : {
        props : [{
            name : 'color',
            type : 'string',
            defaultValue : '#000000'
        }]
    },

    draw : function(context) {
        context.fillStyle = this.color;
        context.fillRect(0, 0, 4000, 4000);
    }

});

Ext.define('Unity.cmp.WrapText', {

	extend :  Unity.cmp.Text ,

	ctype : 'Framework_WrapText',

	configs : {
		props : [{
			name : 'lineWidth',
			type : 'int',
			defaultValue : 0
		}, {
			name : 'lineHeight',
			type : 'int',
			defaultValue : 0
		}]
	},

	draw : function(context) {
		if(this.text && this.lineWidth && this.lineHeight) {
			this.applyTextParamsToContext(context);
			this.drawWrapText(context, this.text, 0, 0, this.lineWidth, this.lineHeight);
		}
	},

	drawWrapText : function(context, text, x, y, maxWidth, lineHeight) {
		var words = text;
		var line = '';
		var lineCount = 1;
		for(var n = 0; n < words.length; n++) {
			var testLine = line + words[n];
			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				if(this.shadowColor) {
					context.fillStyle = this.shadowColor;
					context.fillText(line, x + this.shadowOffsetX, y + this.shadowOffsetY);
				}
				context.fillStyle = this.color;
				context.fillText(line, x, y);
				line = words[n];
				y += lineHeight;
				lineCount ++;
			}
			else {
				line = testLine;
			}
		}
		if(this.shadowColor) {
			context.fillStyle = this.shadowColor;
			context.fillText(line, x + this.shadowOffsetX, y + this.shadowOffsetY);
		}
		context.fillStyle = this.color;
		context.fillText(line, x, y);
		return lineCount;
	}

});

Ext.define('Unity.cmp.BaseTexture', {

	extend:  Unity.Component ,

	ctype: 'Framework_BaseTexture',

	configs : {
		props : [{
			name : 'textureSrc',
			type : 'string',
			defaultValue : '',
			provider : 'texture'
		}]
	},

	texture : null,
	textureLoaded : false,

	loadAssets : function(loader) {
		var me = this;
		if(!me.textureLoaded) {
			if(me.textureSrc) {
				loader.load(me.textureSrc, function(ref) {
					me.texture = ref.get();
					me.textureLoaded = true;
                    me.releaseOnDestroy(ref);
				});
			}
		}
	}

});

Ext.define('Unity.cmp.Texture', {

	extend :  Unity.cmp.BaseTexture ,

	mixins : [
		 Unity.cmp.Alignable 
	],

	ctype : 'Framework_Texture',

	configs : {
		props : [{
			name : 'frame',
			type : 'string',
			defaultValue : '',
			provider : 'texture_frame'
		}]
	},

	init : function() {
		this.updateAlignPosition();
	},

	draw : function(context) {
		if(this.texture && this.frame) {
			this.texture.drawFrame(context, this.frame, this.alignX, this.alignY);
		}
	},

	getAlignWidth : function() {
		var frame;
        if(this.texture && this.frame) {
            frame = this.texture.getFrame(this.frame);
			return frame && frame.w;
		}
		return 0;
	},

	getAlignHeight : function() {
		if(this.texture && this.frame) {
            frame = this.texture.getFrame(this.frame);
			return frame && frame.h;
		}
		return 0;
	}

});

Ext.define('Unity.cmp.TextureNinepatch', {

	extend :  Unity.cmp.Texture ,

	ctype : 'Framework_Texture_9Patch',

	configs : {
		props : [{
			name : 'grid',
			type : 'auto',
			defaultValue : {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			},
			provider : 'positioning'
		}, {
			name : 'size',
			type : 'auto',
			defaultValue : {
				width : 0,
				height: 0
			},
			provider : 'size'
		}]
	},

	draw : function(context) {
		if(this.texture && this.frame) {
			this.texture.drawFrameAs9Grid(context, this.frame, this.grid, this.alignX, this.alignY, this.size.width, this.size.height);
		}
	},

	getAlignWidth : function() {
		if(this.texture && this.frame) {
			return this.size.width;
		}
		return 0;
	},

	getAlignHeight : function() {
		if(this.texture && this.frame) {
			return this.size.height;
		}
		return 0;
	}

});

Ext.define('Unity.cmp.TextureAnimation', {

    extend :  Unity.cmp.BaseTexture ,

    ctype : 'Framework_TextureAnimation',

    configs : {
        props : [{
            name : 'frameTime',
            type : 'int',
            defaultValue : 30
        }, {
            name : 'paused',
            type : 'boolean',
            defaulValue : false
        }]
    },

    frameTime : 30,
    paused : false,

    init : function() {
        this.currentFrame = 0;
        this._currentFrameStartTime = null;
        this._pauseFrameTime = 0;
        this._once = false;
        this._autoRemove = false;
        this._stopFrame = null;
        this._stopFrameCallback = null;
        this._frameListeners = [];
    },

    update : function() {
        var me = this;
        if(!this.texture) return;
        var Time = Unity.Time;
        if(!this._currentFrameStartTime) {
            this._currentFrameStartTime = Time.now;
            this.currentFrame = 0;
            return;
        }
        if(this.paused) {
            this._currentFrameStartTime = Time.now - this._pauseFrameTime;
        }
        if(Time.now - this._currentFrameStartTime >= this.frameTime) {
            this._currentFrameStartTime = Time.now;
            this.currentFrame ++;
            me.fireFrameEvent();
            if(this._stopFrame === this.currentFrame) {
                var callback = this._stopFrameCallback;
                this.paused = true;
                this._stopFrameCallback = null;
                Unity.schedule(callback);
            }
            else if(this.currentFrame === this.getEndFrame()) {
                if(this._once) {
                    Unity.schedule(function(gameObject, autoRemove) {
                        gameObject.setActive(false);
                        autoRemove && gameObject.destroy(true);
                    }, 0, [this.gameObject, this._autoRemove]);
                }
            }
            else if(!this.texture.getFrame(this.currentFrame)) {
                this.currentFrame = 0;

            }
        }
    },

    draw : function(context) {
        if(this.texture) {
            var sourceSize = this.texture.getSpriteSourceSize(this.currentFrame);
            if(sourceSize) {
                this.texture.drawFrame(context, this.currentFrame, sourceSize.x, sourceSize.y);
            }
        }
    },

    fireFrameEvent : function() {
        var me = this;
        var listeners = [].concat(me._frameListeners);
        Unity.schedule(function(currentFrame) {
            listeners.forEach(function(l, i) {
                l.listener(currentFrame, function() {
                    me._frameListeners.splice(i, 1);
                });
            });
        }, 0, [me.currentFrame]);
    },

    addFrameListener : function(listener) {
        this._frameListeners.push({
            listener : listener,
            once : false
        });
    },

    removeFrameListener : function(listener) {
        var ls = this._frameListeners;
        if(ls) {
            var i, len = ls.length;
            for(i=0; i<len; i++) {
                if(ls[i].listener === listener) {
                    ls.splice(i, 1);
                    return;
                }
            }
        }
    },

    getEndFrame : function() {
        return this.texture.frames.length-1;
    },

    gotoAndStop : function(frame, callback) {
        this.play(true, true);
        this._stopFrame = frame;
        this._stopFrameCallback = callback;
    },

    playOnce : function(callback) {
        var endFrame = this.getEndFrame();
        this.play(true, true);
        this.addFrameListener(function(frame, removeListener) {
            if(frame === endFrame) {
                removeListener();
                callback && callback();
            }
        });
    },

    play : function(once, replay, autoRemove) {
        this.paused = false;
        if(!this.paused && !replay) {
            this.gameObject.setActive(true);
            this._once = once;
            return;
        }
        this.currentFrame = 0;
        this.gameObject.setActive(true);
        this._currentFrameStartTime = null;
        this._once = once;
        this._autoRemove = autoRemove;
    },

    setPaused : function(flag) {
        this.paused = flag;
        if(this.paused) {
            this._pauseFrameTime = (Date.now() - this._currentFrameStartTime) || 0;
        }
    }

});

Ext.define('Unity.cmp.Ninepatch', {

	extend :  Unity.cmp.Image ,

	ctype : 'Framework_9patch',

	configs : {
		props : [{
			name : 'grid',
			type : 'auto',
			defaultValue : {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			},
			provider : 'positioning'
		}, {
			name : 'size',
			type : 'auto',
			defaultValue : {
				width : 0,
				height: 0
			},
			provider : 'size'
		}]
	},

	drawRegion : null,

	getAlignWidth : function() {
		return this.size.width;
	},

	getAlignHeight : function() {
		return this.size.height;
	},

	draw : function(context) {
		if(this.image) {
			if(!this.drawRegion) {
				this.drawRegion = {
					x : 0,
					y : 0,
					w : this.image.image.width,
					h : this.image.image.height
				};
			}
			this.image.drawAs9Grid(context, this.drawRegion, this.grid, this.alignX, this.alignY, this.size.width, this.size.height);
		}
	}

});

Ext.define('Unity.cmp.LoopRotation', {

    extend :  Unity.Component ,

    ctype : 'Framework_LoopRotation',

    configs : {
        props: [{
            name : 'speed',
            type : 'double',
            defaultValue : 1
        }]
    },

    speed : 1,

    update : function(delta) {
        this.gameObject.transform.rotation += delta * this.speed;
    }

});

Ext.define('Unity.cmp.hit.AlwaysHit', {

	extend:  Unity.Component ,

	ctype : 'Framework_hit_AlwayHit',

	testHit : function(x, y) {
		return true;
	}

});

Ext.define('Unity.cmp.hit.RectHit', {

	extend :  Unity.Component ,

	ctype : 'Framework_hit_Rect',

	configs : {
		props : [{
			name : 'hitRegion',
			type : 'auto',
			defaultValue : {
				x : 0,
				y : 0,
				width : 0,
				height : 0
			},
			provider : 'rect'
		}, {
			name : 'reverse',
			type : 'boolean',
			defaultValue : false
		}]
	},

	testHit : function(x, y) {
		var r = this.hitRegion;
		var ret = (x >= r.x && x < r.x+r.width && y >= r.y && y < r.y+ r.height);
		return this.reverse ? !ret : ret;
	},

	drawHitRegion : function(context) {
		var r = this.hitRegion;
		if(r) {
			context.save();
			context.beginPath();
			context.rect(r.x, r.y, r.width, r.height);
			context.closePath();
			context.stroke();
			context.restore();
		}
	}

});

Ext.define('Unity.cmp.mask.RectMask', {

	extend:  Unity.Component ,

	ctype : 'Framework_mask_Rect',

	configs : {
		props : [{
			name : 'clipRect',
			type : 'auto',
			defaultValue : {
				x : 0,
				y : 0,
				width : 0,
				height : 0
			},
			provider : 'rect'
		}, {
			name : 'reverse',
			type : 'boolean',
			defaultValue : false
		}]
	},

	clip : function(context) {
		var r = this.clipRect;
		if(r) {
			context.beginPath();
			context.rect(r.x, r.y, r.width, r.height);
			context.clip();
		}
	},

	drawMask : function(context) {
		var r = this.clipRect;
		if(r) {
			context.beginPath();
			context.rect(r.x, r.y, r.width, r.height);
			context.stroke();
		}
	}

});

Ext.define('Unity.cmp.layout.Center', {

    extend :  Unity.Component ,

    ctype : 'Framework_layout_Center',

    configs : {
        props: [{
            name : 'horizontal',
            type : 'boolean',
            defaultValue : true
        }, {
            name : 'vertical',
            type : 'boolean',
            defaultValue : true
        }]
    },

    layout : function() {
        var stage = this.gameObject.getStage();
        var w = this.gameObject.getWidth();
        var h = this.gameObject.getHeight();
        var stageW = stage.getWidth();
        var stageH = stage.getHeight();
        var left = (stageW - w) / 2;
        var top = (stageH - h) / 2;
        var trans = this.gameObject.transform;
        trans.relative = false;
        if(this.horizontal) {
            trans.x = left;
        }
        if(this.vertical) {
            trans.y = top;
        }
    }

});

Ext.define('Unity.cmp.layout.Floating', {

    extend :  Unity.Component ,

    ctype : 'Framework_layout_Floating',

    configs : {
        props: [{
            name : 'float',
            type : 'string',
            defaultValue : '',
            provider : {
                id : 'combobox',
                items : [
                    'right',
                    'bottom',
                    'right_bottom'
                ]
            }
        }]
    },

    layout : function() {
        var stage = this.gameObject.getStage();
        var stageW = stage.getWidth();
        var stageH = stage.getHeight();
        var trans = this.gameObject.transform;

        if(this.float) {
            trans.relative = false;
            switch(this.float) {
                case 'right' :
                    trans.x = stageW;
                    break;
                case 'bottom' :
                    trans.y = stageH;
                    break;
                case 'right_bottom' :
                    trans.x = stageW;
                    trans.y = stageH;
                    break;
            }
        }

    }

});

Ext.define('Unity.cmp.widget.TextureButton', {

	extend:  Unity.cmp.BaseTexture ,

	mixins : [
		 Unity.cmp.hit.RectHit 
	],

	ctype: 'Framework_TextureButton',

	configs : {
		props : [{
            name : 'curFrame',
            type : 'string',
            defaultValue : '',
            provider : 'texture_frame'
        }, {
			name : 'unpressFrame',
			type : 'string',
			defaultValue : '',
			provider : 'texture_frame'
		}, {
			name : 'pressedFrame',
			type : 'string',
			defaultValue : '',
			provider : 'texture_frame'
		}, {
            name : 'disabledFrame',
            type : 'string',
            defaultValue : '',
            provider : 'texture_frame'
        }, {
			name : 'clickScale',
			type : 'boolean',
			defaultValue : 'true'
		}]
	},

	curFrame : null,

	init : function() {
		var me = this;
        me.curFrame = me.curFrame || me.unpressFrame;
		me.gameObject.on({
			scope : me,
			touch : function() {
				me.curFrame = me.pressedFrame;
				if(me.clickScale) {
					me.gameObject.scaleX = me.gameObject.scaleY = 1.12;
				}
			},
			release : function() {
				me.curFrame = me.unpressFrame;
				if(me.clickScale) {
                    me.gameObject.scaleX = me.gameObject.scaleY = 1;
				}
			}
		});
	},

    disable : function() {
        this.curFrame = this.disabledFrame;
        this.gameObject.setTouchable(false);
    },

    enable : function() {
        this.curFrame = this.unpressFrame;
        this.gameObject.setTouchable(true);
    },

	draw : function(context) {
		if(this.texture) {
			this.texture.drawFrame(context, this.curFrame);
		}
	}

});

Ext.define('Unity.AllClasses', {

	           
		              
		              
		              
		              
		                
		                              
		                               
		                          
		                       
		                            
		                           
		                          
		                             


		                       

		                 
		                        
		                      
		                     
		                  
		                        
		                    
		                             
		                             
		                      
		                         
		                          
		                        
		                          
		                          
		                            

		                                
	 

});

Ext.define('Unity.cmp.particle.SimpleProtonParticle', {

    extend :  Unity.Component ,

    ctype : 'Framework_SimpleProtonParticle',

    configs : {
        props : [{
            name : 'imageSrc',
            type : 'string',
            provider : 'image',
            defaultValue : ''
        }]
    },

    init : function() {

    }

});

Ext.define('Unity.cmp.particle.SimpleProtonParticle', {

    extend :  Unity.Component ,

    ctype : 'Framework_ProtonParticle',

    configs : {
        props : [{
            name : 'settings',
            type : 'auto',
            provider : 'proton',
            defaultValue : {}
        }]
    },

    init : function() {

    }

});




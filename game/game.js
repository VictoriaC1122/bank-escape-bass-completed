// for option->talk
function repeatStory(){
	asking=false;
	nowstory=0;
	haveoption=false;
	haveitem=false;
	havedest=false;
	haveareadest=false;
	havetalk=false;
	tellStory();
}
//=============================tellStory() main part============================//
var nowstory=0;
var haveoption=false;
var haveitem=false;
var havedest=false;
var haveareadest=false;
var havetalk=false;
var waiting=false;
var waitTimer=null;
var bgmplaying=true;
var runtextFromUser = false;
//var telling=false;
//var asked=false;

var closerc=false;
var closerbg=false;

var telltimeout;
var position="c";//center r , l  paint也要知道position 所以放到外面
var telling=false;
var talkingname="";//目前要顯示在人名牌上的名字

function beginWait(sec, resumeFn) {
    waiting = true;
    disableClick();
    showWaitIndicator();

    clearTimeout(waitTimer);

    waitTimer = setTimeout(function () {
        waiting = false;
        hideWaitIndicator();
        enableClick();

        if (typeof resumeFn === 'function') {
            resumeFn();
        }
    }, sec * 1000);
}

function enableClick() {
    $('#storyframe').on('click', function() {
        tellStory("",false);
	    if(bgmplaying) document.getElementById('musicplayer').play();
    });
    document.onkeydown = whichKey;
}

function disableClick() {
	$('#storyframe').on('click', function() {});
	document.onkeydown = function() {};
}

function showWaitIndicator() {
    if ($('#storyframe .wait-indicator').length === 0) {
        $('#storyframe').append(
            '<div class="wait-indicator"><span>.</span><span>.</span><span>.</span></div>'
        );
    }
}

function hideWaitIndicator() {
    $('#storyframe .wait-indicator').remove();
}

function createFxState() {
    return {
        running: false,
        started: false,
        startTimer: null,
        midTimer: null,
        endTimer: null,
        target: null,
        finalTransform: '',
        finalClip: 'none',
        
        // 持久 transform 狀態
        inited: false,
        tx: '0%',
        ty: '0%',
        scaleAbs: 1,
        flipX: 1,

        // move 尚未真正開始前的目標值
        pendingMoveTx: null,
        pendingMoveTy: null,
        
        // 微動作用
        microX: 0,
        microY: 0,
        microScale: 1,
        microPhase: Math.random() * Math.PI * 2,
        lastAmbientTransform: '',

        // shake（一次性）
        shakeUntil: 0,
        shakeStart: 0,
        shakeDur: 0,
        shakeAmpX: 8,
        shakeAmpY: 3,

        // tremble（常駐）
        trembleOn: false,
        trembleAmpX: 1.4,
        trembleAmpY: 0.8,

        // breath（常駐）
        breathOn: false,
        breathAmpY: 1.8,
        breathAmpScale: 0.008,

        // float（常駐）
        floatOn: false,
        floatAmpY: 6
    };
}

var fxState = {
    c: createFxState(),
    l: createFxState(),
    r: createFxState(),
    bg: createFxState()
};

function syncFxStateFromDom(slot, $el) {
    var state = fxState[slot];
    if (state.inited) return;

    var parts = getTransformParts($el);

    state.tx = parts.tx + 'px';
    state.ty = parts.ty + 'px';
    state.scaleAbs = Math.abs(parts.sx) || 1;
    state.flipX = (parts.sx < 0) ? -1 : 1;

    state.inited = true;
    state.target = $el;
}

function normalizeTranslateBase(v) {
    if (v == null || v === '') return '0px';

    if (typeof v === 'number') {
        return v + 'px';
    }

    var s = String(v).trim();

    // 純數字就當 px
    if (/^-?\d+(\.\d+)?$/.test(s)) {
        return s + 'px';
    }

    return s;
}

function combineTranslateBaseAndPx(base, extraPx) {
    base = normalizeTranslateBase(base);
    extraPx = parseFloat(extraPx) || 0;

    if (extraPx === 0) return base;

    return 'calc(' + base + ' + ' + extraPx + 'px)';
}

function buildTransformFromState(slot, overrides) {
    var state = fxState[slot];
    overrides = overrides || {};

    var txBase = (overrides.tx != null ? overrides.tx : state.tx);
    var tyBase = (overrides.ty != null ? overrides.ty : state.ty);

    var microX = (overrides.microX != null ? overrides.microX : (state.microX || 0));
    var microY = (overrides.microY != null ? overrides.microY : (state.microY || 0));

    var addX = (overrides.addX != null ? overrides.addX : 0);
    var addY = (overrides.addY != null ? overrides.addY : 0);

    var scaleAbs = (overrides.scaleAbs != null ? overrides.scaleAbs : state.scaleAbs);
    var microScale = (overrides.microScale != null ? overrides.microScale : (state.microScale || 1));
    var flipX = (overrides.flipX != null ? overrides.flipX : state.flipX);

    var sx = scaleAbs * flipX * microScale;
    var sy = scaleAbs * microScale;

    return 'translate('
        + combineTranslateBaseAndPx(txBase, microX + addX)
        + ','
        + combineTranslateBaseAndPx(tyBase, microY + addY)
        + ') scale(' + sx + ',' + sy + ')';
}

function resetMicroMotion(slot) {
    var state = fxState[slot];
    state.microX = 0;
    state.microY = 0;
    state.microScale = 1;
    state.lastAmbientTransform = '';
}

function applyCurrentStateInstant(slot) {
    var $el = getSlotTarget(slot);
    if (!$el) return;

    setTransformInstant(
        $el,
        buildTransformFromState(slot),
        getCurrentClipPath($el)
    );
}

function getActorSlots() {
    return ['c', 'l', 'r'];
}

function getSlotTarget(slot) {
    if (slot == 'c') return $("#charcenter");
    if (slot == 'l') return $("#charleft");
    if (slot == 'r') return $("#charright");
    if (slot == 'bg') return $("#bgimg");
    return null;
}

function getSlotMoveRenderSize(slot) {
    var $el = getSlotTarget(slot);
    if (!$el || !$el.length || !$el[0]) {
        return { w: 0, h: 0 };
    }

    var el = $el[0];

    var w = 0;
    var h = 0;

    try {
        w = $el.outerWidth() || 0;
        h = $el.outerHeight() || 0;
    } catch (e) {}

    if (w > 0 && h > 0) {
        return { w: w, h: h };
    }

    var bgEl = document.getElementById("bgimg");
    var bgH = 0;

    if (bgEl) {
        bgH =
            bgEl.clientHeight ||
            bgEl.offsetHeight ||
            0;
    }

    if (!bgH) {
        try {
            bgH = $("#bgimg").height() || 0;
        } catch (e) {}
    }

    if (h <= 0 && bgH > 0) {
        if (slot === "c") {
            if (closerc) {
                h = bgH * 1.5;
            } else if (ismobile) {
                h = bgH * 1.1;
            } else {
                h = bgH;
            }
        } else if (slot === "l" || slot === "r") {
            if (ismobile) {
                h = bgH * 1.1;
            } else {
                h = bgH;
            }
        } else if (slot === "bg") {
            h = bgH;
        }
    }

    var naturalW = el.naturalWidth || 0;
    var naturalH = el.naturalHeight || 0;

    if (w <= 0 && h > 0 && naturalW > 0 && naturalH > 0) {
        w = h * (naturalW / naturalH);
    }

    if (h <= 0 && w > 0 && naturalW > 0 && naturalH > 0) {
        h = w * (naturalH / naturalW);
    }

    if (w <= 0) {
        try {
            w = el.getBoundingClientRect ? (el.getBoundingClientRect().width || 0) : 0;
        } catch (e) {}
    }

    if (h <= 0) {
        try {
            h = el.getBoundingClientRect ? (el.getBoundingClientRect().height || 0) : 0;
        } catch (e) {}
    }

    return {
        w: w > 0 ? w : 0,
        h: h > 0 ? h : 0
    };
}

function trimAllSpace(v) {
    if (v == null) return v;
    return String(v).replace(/\s+/g, '');
}

function getComputedTransform($el) {
    if (!$el || !$el[0]) return 'none';

    var style = window.getComputedStyle($el[0]);
    return style.transform ||
           style.webkitTransform ||
           style.mozTransform ||
           style.msTransform ||
           style.oTransform ||
           'none';
}

function getTransformParts($el) {
    var transform = getComputedTransform($el);

    if (!transform || transform === 'none') {
        return {
            sx: 1,
            sy: 1,
            tx: 0,
            ty: 0
        };
    }

    // matrix(a, b, c, d, tx, ty)
    var m2 = transform.match(/^matrix\((.+)\)$/);
    if (m2) {
        var arr2 = m2[1].split(',');
        return {
            sx: parseFloat(arr2[0]) || 1,
            sy: parseFloat(arr2[3]) || 1,
            tx: parseFloat(arr2[4]) || 0,
            ty: parseFloat(arr2[5]) || 0
        };
    }

    // matrix3d(...)
    var m3 = transform.match(/^matrix3d\((.+)\)$/);
    if (m3) {
        var arr3 = m3[1].split(',');
        return {
            sx: parseFloat(arr3[0]) || 1,
            sy: parseFloat(arr3[5]) || 1,
            tx: parseFloat(arr3[12]) || 0,
            ty: parseFloat(arr3[13]) || 0
        };
    }

    return {
        sx: 1,
        sy: 1,
        tx: 0,
        ty: 0
    };
}

function buildTransform(parts) {
    return 'translate(' + parts.tx + 'px,' + parts.ty + 'px) scale(' + parts.sx + ',' + parts.sy + ')';
}

function getCurrentClipPath($el) {
    if (!$el || !$el[0]) return 'none';
    var style = window.getComputedStyle($el[0]);
    return style.clipPath || $el.css('clip-path') || 'none';
}

function setTransformInstant($el, transform, clipPath) {
    $el.css({
        '-o-transition': 'none',
        '-webkit-transition': 'none',
        '-moz-transition': 'none',
        'transition': 'none',
        '-webkit-transform': transform,
        '-moz-transform': transform,
        '-o-transform': transform,
        'transform': transform,
        'clip-path': clipPath || 'none'
    });
}

function setTransformAnimated($el, transform, sec) {
    $el.css({
        '-o-transition': 'all ' + sec + 's ease-in-out',
        '-webkit-transition': 'all ' + sec + 's ease-in-out',
        '-moz-transition': 'all ' + sec + 's ease-in-out',
        'transition': 'all ' + sec + 's ease-in-out',
        '-webkit-transform': transform,
        '-moz-transform': transform,
        '-o-transform': transform,
        'transform': transform
    });
}

function freezeCurrentTransform($el) {
    var currentTransform = getComputedTransform($el);
    var currentClip = getCurrentClipPath($el);

    if (!currentTransform || currentTransform === 'none') {
        currentTransform = buildTransform({
            sx: 1,
            sy: 1,
            tx: 0,
            ty: 0
        });
    }

    setTransformInstant($el, currentTransform, currentClip);

    // 強制 reflow
    $el[0].offsetHeight;
}

function clearFxTimers(state) {
    clearTimeout(state.startTimer);
    clearTimeout(state.midTimer);
    clearTimeout(state.endTimer);
    state.startTimer = null;
    state.midTimer = null;
    state.endTimer = null;
}

function finishFx(slot) {
    var state = fxState[slot];
    if (!state || !state.running || !state.target) return;

    clearFxTimers(state);

    if (state.started) {
        freezeCurrentTransform(state.target);
    }

    // 如果這是一個尚未真正開始的 move，先把 pending 目標提交成正式 state
    if (state.pendingMoveTx != null) state.tx = state.pendingMoveTx;
    if (state.pendingMoveTy != null) state.ty = state.pendingMoveTy;

    var fallbackTransform = buildTransformFromState(slot);

    setTransformInstant(
        state.target,
        state.finalTransform || fallbackTransform,
        state.finalClip || 'none'
    );

    state.running = false;
    state.started = false;
    state.finalTransform = '';
    state.finalClip = 'none';
    state.pendingMoveTx = null;
    state.pendingMoveTy = null;
}

function finishAllFx() {
    finishFx('c');
    finishFx('l');
    finishFx('r');
    finishFx('bg');
}

function finishFxIfRunning(slot) {
    if (!slot || !fxState[slot]) return;

    if (fxState[slot].running) {
        finishFx(slot);
    }
}

function resetFxState(slot) {
    var state = fxState[slot];

    state.running = false;
    state.started = false;
    state.finalTransform = '';
    state.finalClip = 'none';
    state.pendingMoveTx = null;
    state.pendingMoveTy = null;

    clearFxTimers(state);
}

function startOneStageFx(slot, $el, delayMs, durationSec, finalTransform, finalClip, onStart) {
    var state = fxState[slot];

    finishFx(slot);

    state.running = true;
    state.started = false;
    state.target = $el;
    state.finalTransform = finalTransform;
    state.finalClip = finalClip || getCurrentClipPath($el);

    state.startTimer = setTimeout(function () {
        state.started = true;

        if (typeof onStart === 'function') {
            onStart();
        }

        setTransformAnimated($el, finalTransform, durationSec);

        state.endTimer = setTimeout(function () {
            resetFxState(slot);
            if (telling) telling = false;
        }, durationSec * 1000);

    }, delayMs);
}

function startTwoStageFx(slot, $el, delayMs, stage1Sec, midTransform, stage2Sec, finalTransform, finalClip) {
    var state = fxState[slot];

    finishFx(slot);

    state.running = true;
    state.started = false;
    state.target = $el;
    state.finalTransform = finalTransform;
    state.finalClip = finalClip || getCurrentClipPath($el);

    state.startTimer = setTimeout(function () {
        state.started = true;

        setTransformAnimated($el, midTransform, stage1Sec);

        state.midTimer = setTimeout(function () {
            setTransformAnimated($el, finalTransform, stage2Sec);
        }, stage1Sec * 1000);

        state.endTimer = setTimeout(function () {
            resetFxState(slot);
            if (telling) telling = false;
        }, (stage1Sec + stage2Sec) * 1000);

    }, delayMs);
}

function getRawMatrixParts($el) {
    var targetMatrix =
        $el.css("-webkit-transform") ||
        $el.css("-moz-transform") ||
        $el.css("-ms-transform") ||
        $el.css("-o-transform") ||
        $el.css("transform");

    if (!targetMatrix || targetMatrix === "none") {
        return {
            sx: 1,
            sy: 1,
            tx: 0,
            ty: 0
        };
    }

    var matrix = targetMatrix.replace(/[^0-9\-.,]/g, '').split(',');

    return {
        sx: parseFloat(matrix[0]) || 1,
        sy: parseFloat(matrix[3]) || 1,
        tx: parseFloat(matrix[4]) || 0,
        ty: parseFloat(matrix[5]) || 0
    };
}

function ensureSlotInited(slot) {
    var state = fxState[slot];
    var $el = getSlotTarget(slot);
    if (!$el) return;

    if (!state.inited) {
        syncSlotStateFromDomNow(slot);
    }
}

function syncSlotStateFromDomNow(slot) {
    var $el = getSlotTarget(slot);
    if (!$el) return;

    var raw = getRawMatrixParts($el);

    fxState[slot].target = $el;
    fxState[slot].inited = true;
    fxState[slot].tx = raw.tx + 'px';
    fxState[slot].ty = raw.ty + 'px';
    fxState[slot].scaleAbs = Math.abs(raw.sx) || 1;
    fxState[slot].flipX = (raw.sx < 0) ? -1 : 1;
}

var ambientRAF = null;

function ensureAmbientLoop() {
    if (ambientRAF == null) {
        ambientRAF = requestAnimationFrame(runAmbientLoop);
    }
}

function runAmbientLoop(now) {
    var hasAnyAmbient = false;
    if (telling) telling = false;

    getActorSlots().forEach(function (slot) {
        var state = fxState[slot];
        var $el = getSlotTarget(slot);
        if (!$el) return;
        if (!state.inited) ensureSlotInited(slot);

        // 第一版：如果這個角色正在做 move / scale / flip / jump，就先暫停微動作
        if (state.running) return;

        var x = 0;
        var y = 0;
        var sc = 1;

        // shake：一次性，帶衰減
        if (state.shakeUntil > now) {
            hasAnyAmbient = true;

            var elapsed = now - state.shakeStart;
            var progress = elapsed / state.shakeDur;
            var decay = Math.pow(1 - progress, 1.5);

            x += Math.sin(elapsed * 0.09 + state.microPhase) * state.shakeAmpX * decay;
            y += Math.cos(elapsed * 0.13 + state.microPhase) * state.shakeAmpY * decay;
        } else {
            state.shakeUntil = 0;
        }

        // tremble：持續細顫
        if (state.trembleOn) {
            hasAnyAmbient = true;
            x += Math.sin(now * 0.060 + state.microPhase) * state.trembleAmpX;
            y += Math.cos(now * 0.085 + state.microPhase) * state.trembleAmpY;
        }

        // breath：待機呼吸
        if (state.breathOn) {
            hasAnyAmbient = true;
            var b = Math.sin(now * 0.0028 + state.microPhase);
            y += b * state.breathAmpY;
            sc *= (1 + b * state.breathAmpScale);
        }

        // float：慢慢浮動
        if (state.floatOn) {
            hasAnyAmbient = true;
            y += Math.sin(now * 0.0018 + state.microPhase * 1.3) * state.floatAmpY;
        }

        state.microX = x;
        state.microY = y;
        state.microScale = sc;

        var t = buildTransformFromState(slot);

        if (t !== state.lastAmbientTransform) {
            setTransformInstant($el, t, getCurrentClipPath($el));
            state.lastAmbientTransform = t;
        }
    });

    if (hasAnyAmbient) {
        ambientRAF = requestAnimationFrame(runAmbientLoop);
    } else {
        // 沒有任何常駐／一次性微動作時，把值歸零
        getActorSlots().forEach(function (slot) {
            var state = fxState[slot];
            if (state.microX !== 0 || state.microY !== 0 || state.microScale !== 1) {
                resetMicroMotion(slot);
                applyCurrentStateInstant(slot);
            }
        });

        ambientRAF = null;
    }
}

function tellStory(fromUser=false, tellingstage){

    if(waiting && fromUser) return;
    
	if(telling) {
		if(st.length-ss>3  && !fadingchar  && !autotell){
			ss=st.length;
			nows=st;
		}
		return;
	}

	if(tellingstage=="" || tellingstage==null) tellingstage=stagename;
	if(tellingstage!=stagename) return;

	if(fadingbg){//不管fading 繼續tell的效果比較實際
		telltimeout=window.setTimeout("tellStory();", 20 );
		return;
	}
	
	if(fadingchar && autotell){
        telltimeout = window.setTimeout(function(){
            tellStory(false, tellingstage);
        }, 20);
        return;
    }

	if(!gamestart) return;

	//talkingname="";
	layer[5]="";
	paintInfo();

	if(scriptlength>nowstory) {

		var ns=script[nowstory];
		if(ns.replace(" ","")==""){
			nowstory++;
			tellStory();
			return;
		}

        var telllenlimit=91;
        if(!ismobile) telllenlimit=9157;
        if(ns.length>telllenlimit && ns.indexOf("sys(")==-1){
        	script[nowstory]="..."+ns.substring(telllenlimit,ns.length);
        	ns=ns.substring(0,telllenlimit)+"...";
        	nowstory--;
        }


		//alert(ns); 
		var name="";
		var sound="";
		var src="";
		var stat="";
		var havechar=false;
		
		position="c";//center r , l  每次的預設值為c 所以這邊也要有
		var facename="";

		//if there is a char to speak
		if(ns.indexOf("]:")!=-1){
			name=ns.substring(0,ns.indexOf("["));
			//name=name.replace(" ","");
			//alert(name);
			name=name.replace("\t","");
			for (i=0;i<chars.length ;i++ ){
				if(name== chars[i].name) havechar=true;
			}

			if(havechar){
				//由face name 抓出face的src  如果沒有facename src是空的 就代表消失
				facename=ns.substring(ns.indexOf("[")+1,ns.indexOf("]") );
				if(facename.indexOf(",")!=-1){//有在script中指示位子			
					var tmp=facename.split(",");
					facename=tmp[0];
					position=tmp[1];
				}
				for(k=0;k<chars.length;k++){
					if(chars[k].name==name){
						//sound=chars[k].sound[1];
						for(z=0;z<chars[k].face.length;z++){//z=0 name z=1 src z=2 sound src
							try{
								var tmp=chars[k].face[z];
								if(facename==chars[k].face[z][0]){
									src=chars[k].face[z][1];
									sound=chars[k].face[z][2];
								}
							}catch(e){}
						}
					}
				}
				stat=ns.substring(ns.indexOf("]:")+2, ns.length);
			}
		}else{
			stat=ns;
		}

		//deal sys(code) function
        if (bgmplaying) document.getElementById('musicplayer').play();

        var cmd = "";
        var inlineSys = { pre:"", post:"" };

        if(stat.indexOf("sys(") != -1){  //如果有system function call的話
            var left = 0;
            var end = 0;
            var right = 0;

            for(var i=0;i<stat.length;i++){
                var nowchar = stat.charAt(i);
                if(nowchar=="(") left++;
                if(nowchar==")") right++;
                if(left==right && left>0){
                    end = i + 1;
                    break;
                }
            }

            cmd = stat.substring(stat.indexOf("sys(")+4, end-1);
            stat = stat.substring(end, stat.length);
            inlineSys = splitInlineSysPhases(cmd);
        }

        // 先處理會影響本句文字 / 會清掉文字的 sys
        if(inlineSys.pre != ""){
            st = stat;
            sys(inlineSys.pre);
            stat = st;
        }
        
        // 如果這句本身沒有可見文本，而且 post-sys 裡面有 autotell，
        // 要先把 autotell 抽出來執行，避免 tell("") 先把下一句排掉。
        if(trimAllSpace(stat) == "" && inlineSys.post != ""){
            var postSplit = splitImmediateAutotellFromPost(inlineSys.post);
            if(postSplit.immediate != ""){
                sys(postSplit.immediate);
            }
            inlineSys.post = postSplit.remain;
        }
        
        if(havechar && (stat.replace(" ","") != "")){
            if(shownametag){
                talkingname = name;
                $("#nametag").html("");
                if(shownametag) $("#nametag").delay(0).fadeIn();
            }else{
                stat = "<font color="+name_color+">"+name+" : </font>" + stat;
            }
        }else{
            $("#nametag").fadeOut(function(){talkingname="";});
        }
        
        tell(stat); // 文字一定在 pre-sys 處理完成後才開始顯示

		//專門處理畫面, same stage,所以基本上只有人需要paintscreen
		//沒有檢察到同樣的仁不同照片//stat空白也部會消失 layer 1 2 3 => c L R
		var first=true;
		if(havechar){
			if(name== getName(layer[1]) ||name== getName(layer[2])||name== getName(layer[3]))
			first=false;

			var effect="";
			if(position.indexOf(":")!=-1){//有在script中指示特效		
					var tmp=position.split(":");
					position=tmp[0];
					effect=tmp[1];
					if(tmp[2]>0)
					onestep=new Number(tmp[2]);
					else  onestep="";
			}else{
				showing_effect[1]="";
				char_effect[1]="";
				effect_pos=1;
			}

			if(position=="c" || position=="C" ){
				position="c";				
				//先判斷人物是否有更改  yes表情改 no都沒改 char改人物 new新登場
				if(layer[1]!=src) face_change[1]="yes"; else face_change[1]="no";			
				if(getName(layer[1])!=getName(src)) face_change[1]="char";
				if(layer[1]=="") face_change[1]="new";
				layer[1]=src; 
				if(effect!="") face_change[1]=effect;

				if(getName(layer[2])==name){ //如果是同一個人物 就要移動 取消原本位子
					layer[2]="";
				}
				if(getName(layer[3])==name) {
					layer[3]="";
				}
			}else
			if(position=="l" || position=="L" ){
				position="l";
				if(layer[2]!=src) face_change[2]="yes"; else face_change[2]="no";			
				if(getName(layer[2])!=getName(src)) face_change[2]="char";
				if(layer[2]=="") face_change[2]="new";
				layer[2]=src; //先判斷人物與表情是否有更改在指定為新
				if(effect!="") face_change[2]=effect;

				if(getName(layer[1])==name){ //如果是同一個人物 就要移動 取消原本位子
					layer[1]="";
				}
				if(getName(layer[3])==name) {
					layer[3]="";
				}
			}else
			if(position=="r" || position=="R" ){
				position="r";
				if(layer[3]!=src) face_change[3]="yes"; else face_change[3]="no";			
				if(getName(layer[3])!=getName(src)) face_change[3]="char";
				if(layer[3]=="") face_change[3]="new";
				layer[3]=src; //先判斷人物與表情是否有更改在指定為新
				if(effect!="") face_change[3]=effect;


				if(getName(layer[1])==name){ //如果是同一個人物 就要移動 取消原本位子
					layer[1]="";
				}
				if(getName(layer[2])==name) {
					layer[2]="";
				}
			}else{
				//等於預設c
				position="c";
				if(layer[1]!=src) face_change[1]="yes"; else face_change[1]="no";			
				if(getName(layer[1])!=getName(src)) face_change[1]="char";
				if(layer[1]=="") face_change[1]="new";
				layer[1]=src; //先判斷人物與表情是否有更改在指定為新
				if(effect!="") face_change[1]=effect;

				if(getName(layer[2])==name){ //如果是同一個人物 就要移動 取消原本位子
					layer[2]="";
				}
				if(getName(layer[3])==name) {
					layer[3]="";
				}
			}
/*
			if(facename=="") {
		
				if( getName(layer[3])==name) layer[3]="";
				if( getName(layer[2])==name) layer[2]="";
				if( getName(layer[1])==name) layer[1]="";			
						//alert(layer[1]);
			}
*/
			paintChar();//這邊主要是paint chars的
			if(first && sound!="" && sound!=null){
				loadEffect(sound);//here is for char sound
			}
		}
	
		nowstory++; //重要, 不可再cmd 之後才加, 會導致多加一次
		
		if(inlineSys.post != "") {
            sys(inlineSys.post); // 保留原本「顯示完本句再跑」的那批 sys
        }

		if(shownametag && st!='' && stat!=''){
	        $("#reviewtell").html($("#reviewtell").html()+"<br><font color="+name_color+">"+name+" </font>"+st);
	    }else if(st!='' && stat!='') {
	    	$("#reviewtell").html($("#reviewtell").html()+"<br>"+st);
    	}

/*20151111 為何取消? 到底該不該有?
		if(!havechar && stat==""){
			tellStory(tellingstage);//如果整行空白 只有cmd 就自動在tellstory  執行完cmd後, but 如果cmd gostage 後就不應該繼續下一行
		}
*/		

	    if(scriptlength==(nowstory-1)) ask();
		
	}else{
		ask(); 
	}

	clearSelection();
	//telling=false;
	//alert("tellover");
}


//var answering=false;
var asking=false;
function ask(){    //處理最後的問問題部份

//if(inoption)	alert("!");
		if(asking) return;
		asking=true;
		haveoptions=false;		
		

		//只要還有cmd要處理, 就不結速這個stage
		if(cmding & 0) {//2015 實際無法阻擋 且可能造成攔截問題
			//if(uid=='lazi') alert("ask again");
			window.setTimeout("ask();", 100 );
			return;
		}
		if(nextstage=="?"){//選擇
			hidefulltell();//有選項才需要hidefull 不然直接gostage  而且同時在極短時間hide show fade會混亂調時機
			var num_op=0;
			for(i=0;i<option.length;i++){
				if(option[i][0]!="") { 
					haveoption=true; 
					num_op+=1; 
					if( option[i][0]=="move" ) 
						havedest=true;
					if( option[i][0]=="use" ) 
						haveitem=true;
					if( option[i][0]=="select" ) 
						haveareadest=true;
					if( option[i][0]=="talk" ) 
						havetalk=true;
				}			
			}
			
			if(haveoption & ( num_op!=1  | havetalk ) ){
					showOption();//go to deal with options
			}else{
					if(havedest) showDest();//skip the action question
					if(haveitem) showItem();
					if(haveareadest) showSelect();
			}
		}else
		if(nextstage!="?" && stagename!="end"){//自動到下一個stage
			goStage(nextstage);
		}
		// do nothing for stagename="end";
}


//var going=false;
function goStage(n,evt,m){
	if(evt)
	stopevent(evt);//新舞台進入後 所有未執行的event都取消
//alert("gostage:"+storyhide);
	asking=false;
	if(fulltellmode) {
		//if(uid=='lazi') alert("showfulltell");
		showfulltell();
	}
	 
	if(n!=stagename) $("#reviewtell").html("");
	$("#option-container").fadeOut(optionshowtime);

			selecting=false;//選擇新目的地了
			clearTimeout(telltimeout);//跳到新的舞台 如果還有上一舞台的tellstory等待執行 就取消
			
            //alert("Now: "+stagename+" Next: "+nextstage);
			//if(n==stagename) return;
                
				layer[4]="";
				option=new Array("","","",""); //talk , use, move, select 
				itemdest=new Array(new Array("","","","",""));///item pic src, name, desc, destnum, soundsrc[0]-[5]
				scenedest=new Array(new Array("","","","",""));///room pic src, name, desc, destnum, soundsrc
				areadest=new Array(new Array("",""));//pos num, dest
				oldstage=stagename;
				stagename=n;
				nowstory=0;
				if (!isNaN(m) && !isNaN(parseInt(m))) {nowstory=m;}
				haveoption=false;
				haveitem=false;
				havedest=false;
				havetalk=false;
				haveareadest=false;
//	 alert("aft");
				loadData();
//	 alert("aft");				
				return;
}


//=================end of tellStory ============================//

//=================sys function ============================//
var nown=0;
var nowstorytop=355;
let shockFrame = null;

function laterShock(options = {}) {
    var bg = $('#bgimg');
    var eff1 = $('#effectlayer');
    var eff2 = $('#effectlayer2');
    var eff3 = $('#effectlayer3');

    const duration = parseFloat(options.duration) || 380;
    const power = parseFloat(options.power) || 14;
    const charRatio = parseFloat(options.charRatio) || 0.45;
    const rotatePower = parseFloat(options.rotatePower) || 0.8;
    const start = performance.now();

    // 先確保 state 已初始化
    ensureSlotInited('bg');
    ensureSlotInited('c');
    ensureSlotInited('l');
    ensureSlotInited('r');

    // 若上一個 shock 未結束，先還原到目前 state 再取消
    if (shockFrame) {
        cancelAnimationFrame(shockFrame);
        applyCurrentStateInstant('bg');
        applyCurrentStateInstant('c');
        applyCurrentStateInstant('l');
        applyCurrentStateInstant('r');
        eff1.css('transform', '');
        eff2.css('transform', '');
        eff3.css('transform', '');
    }

    function applyShockToSlot(slot, dx, dy) {
        var $el = getSlotTarget(slot);
        if (!$el) return;
    
        var transform = buildTransformFromState(slot, {
            addX: dx,
            addY: dy
        });
    
        $el.css({
            '-o-transition': 'none',
            '-webkit-transition': 'none',
            '-moz-transition': 'none',
            'transition': 'none',
            '-webkit-transform': transform,
            '-moz-transform': transform,
            '-o-transform': transform,
            'transform': transform
        });
    }

    function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        const decay = Math.pow(1 - progress, 1.7);
        const amp = power * decay;

        const x = Math.sin(elapsed * 0.11) * amp;
        const y = Math.cos(elapsed * 0.17) * amp * 0.7;
        const rot = Math.sin(elapsed * 0.13) * rotatePower * decay;

        // 背景：保留原本 tx/ty/scale，再疊加 shock 位移與 rotate
        var bgBase = buildTransformFromState('bg', {
            addX: x,
            addY: y
        });

        bg.css({
            '-o-transition': 'none',
            '-webkit-transition': 'none',
            '-moz-transition': 'none',
            'transition': 'none',
            '-webkit-transform': bgBase + ' rotate(' + rot + 'deg)',
            '-moz-transform': bgBase + ' rotate(' + rot + 'deg)',
            '-o-transform': bgBase + ' rotate(' + rot + 'deg)',
            'transform': bgBase + ' rotate(' + rot + 'deg)'
        });

        eff1.css('transform', `translate(${x}px, ${y}px) rotate(${rot}deg)`);
        eff2.css('transform', `translate(${x}px, ${y}px) rotate(${rot}deg)`);
        eff3.css('transform', `translate(${x}px, ${y}px) rotate(${rot}deg)`);

        // 人物：在既有 move / scale / flip / micro motion 上再疊一層 shock 偏移
        applyShockToSlot('c', -x * charRatio, -y * charRatio);
        applyShockToSlot('l', -x * charRatio, -y * charRatio);
        applyShockToSlot('r', -x * charRatio, -y * charRatio);

        if (progress < 1) {
            shockFrame = requestAnimationFrame(animate);
        } else {
            // 回到 state，而不是清成空 transform
            applyCurrentStateInstant('bg');
            applyCurrentStateInstant('c');
            applyCurrentStateInstant('l');
            applyCurrentStateInstant('r');

            eff1.css('transform', '');
            eff2.css('transform', '');
            eff3.css('transform', '');

            shockFrame = null;
        }
    }

    shockFrame = requestAnimationFrame(animate);
}

var storyhide=false;
function storystate(){	
		if(storyhide ){
			$("#storyframe").fadeIn(800);
			if(shownametag & talkingname!="") $("#nametag").fadeIn();
			storyhide=false;
			//alert("fadein");
		}else{
			$("#storyframe").fadeOut();
			$("#nametag").fadeOut();
			storyhide=true;	
			//alert("hide");
		}		
}

function storystateslide(){	
		if(storyhide ){
			$("#storyframe").slideDown();
			if(shownametag) $("#nametag").fadeIn();
			storyhide=false;
			//alert("fadein");
		}else{
			$("#storyframe").slideUp();
			$("#nametag").fadeOut();
			storyhide=true;	
			//alert("hide");
		}		
}


var fulltellmode=false;
function showfulltell(){
	if(!fulltellmode) return;
	//alert("!");
	if(!storyhide & framemode=="up") {storystate();}
	$("#fulltellframe").fadeOut(0);
	//$("#fulltellframe").css('z-index',20);
	//if(uid=='lazi') alert("!!!");
	$("#fulltellframe").fadeIn();
	fulltell=true;
}

function hidefulltell(){
	$("#fulltellframe").fadeOut(function(){});	
	fulltell=false;
}



var cmding=false;
var stagetimer;
var allowsave=true;
var shownametag=false;

function splitInlineSysPhases(cmd){
    var rawCmds = String(cmd || "").split(",");
    var pre = [];
    var post = [];

    for(var i=0;i<rawCmds.length;i++){
        var one = String(rawCmds[i] || "");
        var head = one.split(":")[0];
        head = head.replace(/\s+/g, "").toLowerCase();

        // 這些要在 tell(stat) 之前先做
        if(
            head == "bg" ||
            head == "effectlayer" ||
            head == "showv" ||
            head == "emphasise"
        ){
            pre.push(one);
        }else{
            post.push(one);
        }
    }

    return {
        pre: pre.join(","),
        post: post.join(",")
    };
}

function splitImmediateAutotellFromPost(cmd){
    var rawCmds = String(cmd || "").split(",");
    var immediate = [];
    var remain = [];

    for(var i=0;i<rawCmds.length;i++){
        var one = String(rawCmds[i] || "");
        var head = one.split(":")[0];
        head = head.replace(/\s+/g, "").toLowerCase();

        // 只提前處理 autotell:off
        if(head == "autotell"){
            var parts = one.split(":");
            var act = String(parts[1] || "").replace(/\s+/g, "").toLowerCase();

            if(act == "off"){
                immediate.push(one);
            }else{
                remain.push(one);
            }
        }else{
            remain.push(one);
        }
    }

    return {
        immediate: immediate.join(","),
        remain: remain.join(",")
    };
}

function sys(cmd){//sys 用來幫助該句子的表達
	//alert("cmd");

	cmding=true;
        var cmds=cmd.split(",");

        for(var cmdIdx=0; cmdIdx<cmds.length; cmdIdx++){

            var ncmd=cmds[cmdIdx];
            ncmd=ncmd.replace(" ","");
            ncmd=ncmd.replace("\t","");
            var para="";
            if(ncmd.indexOf(":")!=-1) {
                para=ncmd.split(":");
                ncmd=para[0];
            }
		if(ncmd=="textoption"){
			para[1]=para[1].replace(" ","");			
			if(para[1]=="on"){
				textoption=true;
			}
			if(para[1]=="off"){
				textoption=false;
			}
		}	
		if(ncmd=="storytop" && !ismobile){//不支援超小畫面
			sys("fulltell:off");//直接呼叫會導致對話框消失出現消失出現的 但應該由設計者負責避開
			para[1]=para[1].replace(" ","");	
			if(para[1]=="default"){
				storytop=false;
				$("#storyframe").fadeOut(0,function(){init(); $(this).fadeIn();});
				
				
				//不可以用return or 後續指令就沒執行了
			}
			if(para[1].indexOf("%")!=-1){
				storytop=(para[1].substring(0,para[1].length-1))/100;
				$("#storyframe").fadeOut(function(){init(); $(this).fadeIn();});
				/*
				$("#storyframe").animate({
					top: $('#bgimg').height()*storytop-(25/130)* $('#storyframe').height();
				},2000,function(){init(); });*/
			}
		}	
		if(ncmd=="storymargin"){
			//alert(para[1]);
			if(para[1]!=null) storymargin=para[1];
			if(para[2]!=null) storymargintop=para[2];
			//alert(storymargin+":"+storymargintop);
			init();
		}	
		if(ncmd=="tellspeed"){
			//alert(delaytime);
			if(para[1]=="default"){
				delaytime=30;
				//alert(delaytime);
			}else if(para[1]!=null & para[1]!="0"){
				delaytime=delaytime/(para[1]*1);
			}
		}	
		if(ncmd=="autotell"){
            var autotellact="on";
            if(para[1]!=null) autotellact=String(para[1]).replace(/\s+/g, "").toLowerCase();
        
            if(autotellact=="on"){
                clearTimeout(autotelltimer);
                autotelldelay = 0;
                autotell = true;
        
                // 不可同步 tellStory()，否則會在 tellStory → sys → tellStory 中遞迴
                autotelltimer = setTimeout(function(){
                    if(!waiting && !telling && !asking){
                        tellStory();
                    }
                }, 0);
            }
        
            if(autotellact=="off"){
                autotell = false;
                clearTimeout(autotelltimer);
                autotelldelay = 0;
            }
        }
		if(ncmd=="nametag"){
			para[1]=para[1].replace(" ","");	
			if(para[2]!=null) para[2]=para[2].replace(" ","");		
			if(para[3]!=null) para[3]=para[3].replace(" ","");		
			if(para[4]!=null) para[4]=para[4].replace(" ","");		
			if(para[1]=="on"){
				shownametag=true;
				//$("#nametag").css("display","inline");
				if(para[2]!=null) $("#nametag").css("width",para[2]);
				if(para[3]!=null) $("#nametag").css("left",para[3]);
				
				if(para[4]!=null) {
					//alert(para[4]);
				
					nametageoffset=((25/130)*$('#storyframe').height())*para[4]*-0.1;
					//alert(nametageoffset);
				}
				init();
			}
			if(para[1]=="off"){
				shownametag=false;
				$("#nametag").css("display","none");
			}
		}	
		if(ncmd=="fulltell"){
			para[1]=para[1].replace(" ","");			
			if(para[1]=="on"){
				fulltell=true;
				fulltellmode=true;
				if(!storyhide & framemode=="up") storystate();
				showfulltell();
				init();
			}
			if(para[1]=="off"){
				fulltell=false;
				fulltellmode=false;
				if(storyhide & framemode=="up") storystate();
				hidefulltell();
				init();
			}
		}
		if(ncmd=="nodelaytell"){
			para[1]=para[1].replace(" ","");			
			if(para[1]=="on"){
				setDelay(0);
			}
			if(para[1]=="off"){
				setDelay(40);
			}
		}
		if(ncmd=="charselect"){
			para[1]=para[1].replace(" ","");			
			if(para[1]=="on"){
				charselect=true;
			}
			if(para[1]=="off"){
				charselect=false;
			}
		}
		if(ncmd=="closer"){
			para[1]=para[1].replace(" ","");	
			if(para[1]=="bg"){
			    document.getElementById("temp_bgimg").src = document.getElementById("bgimg").src;
			    var bgst = document.getElementById("bgimg").getAttribute("style");
			    document.getElementById("temp_bgimg").setAttribute("style", bgst);
			    $("#bgimg").fadeOut(0,function(){
			        $(this).fadeIn(2000,function(){
			            document.getElementById("temp_bgimg").src = "../transparent.png";})});
			    $("#bgimg").css({'scale':'150%',
			                    '-o-transition': 'scale 0s ease-in-out', 
            			        '-webkit-transition': 'scale 0s ease-in-out', 
            			        '-moz-transition': 'scale 0s ease-in-out', 
            			        'transition': 'scale 0s ease-in-out'
			                    });
			    closerbg=true;
			}
			if(para[1]=="c"){
				closerc=true;
				$("#charcenter").fadeOut(0,function(){init(); $(this).fadeIn();});
			}
			if(para[1]=="l"){
			}
			if(para[1]=="r"){
			}
			if(para[1]=="off"){
				closerc=false;	
				$("#charcenter").fadeOut(0,function(){init(); $(this).fadeIn();});
                if (closerbg) {
                    document.getElementById("temp_bgimg").src = document.getElementById("bgimg").src;
    			    var bgst = document.getElementById("bgimg").getAttribute("style");
    			    document.getElementById("temp_bgimg").setAttribute("style", bgst);
    			    $("#temp_bgimg").css({
			                    '-o-transition': 'all 0s ease-in-out', 
            			        '-webkit-transition': 'all 0s ease-in-out', 
            			        '-moz-transition': 'all 0s ease-in-out', 
            			        'transition': 'all 0s ease-in-out'
            			        });
    			    $("#bgimg").fadeOut(0,function(){
    			        $(this).fadeIn(2000,function(){
    			            document.getElementById("temp_bgimg").src = "../transparent.png";})
    			        $("#temp_bgimg").fadeOut(2000);
    			    });
    			    $("#bgimg").css({'scale':"100%",
			                    '-o-transition': 'scale 0s ease-in-out', 
            			        '-webkit-transition': 'scale 0s ease-in-out', 
            			        '-moz-transition': 'scale 0s ease-in-out', 
            			        'transition': 'scale 0s ease-in-out'
            			        });
				    closerbg=false;
                }
				
			}
		}		

		if(ncmd=="filter"){
			//if(uid=="lazi") alert(para[2]);
			
			if(para[1]!=null) para[1]=para[1].replace(" ","");			
			if(para[2]!=null) para[2]=para[2].replace(" ","");
			
			
			if(para[1]=="off"){
				nofilter=true;
				$("#bgimg").css('-webkit-filter','none');
				$("#charcenter").css('-webkit-filter','none');
				$("#charleft").css('-webkit-filter','none');
				$("#charright").css('-webkit-filter','none');
				
			}
			if(para[1]=="bg"){
				$("#bgimg").css('-webkit-filter',para[2]);
				nofilter=false;
			}
			if(para[1]=="c"){
				
				$("#charcenter").css('-webkit-filter',para[2]);
			}
			if(para[1]=="l"){
				$("#charleft").css('-webkit-filter',para[2]);
			}
			if(para[1]=="r"){
				$("#charright").css('-webkit-filter',para[2]);
			}

		}			
		
		if(ncmd=="shock"){
			var shock_duration=380;
			var shock_power=14;
			var shock_charRatio=0.45;
			var shock_rotatePower=0.8;
			
			if(para[1]!=null) {
			    para[1]=para[1].replace(" ","");
			    if (para[1]!="") shock_duration=para[1];
			}
			if(para[2]!=null) {
			    para[2]=para[2].replace(" ","");
			    if (para[2]!="") shock_power=para[2];
			}
			if(para[3]!=null) {
			    para[3]=para[3].replace(" ","");
			    if (para[3]!="") shock_charRatio=para[3];
			}
			if(para[4]!=null) {
			    para[4]=para[4].replace(" ","");
			    if (para[4]!="") shock_rotatePower=para[4];
			}
			
			//alert("duration: "+shock_duration+", power: "+shock_power+", charRatio: "+shock_charRatio+", rotatePower: "+shock_rotatePower);
			window.setTimeout("laterShock({duration: "+shock_duration+", power: "+shock_power+", charRatio: "+shock_charRatio+", rotatePower: "+shock_rotatePower+"});", 200);//in order to make shock and text appear at the same time
			
	
		}

		if(ncmd=="gamesave"){
			save2();
		}
		if(ncmd=="gameload"){
			load2();
		}

		if(ncmd=="timer"){
			para[1]=para[1].replace(" ","");			
			
			if(para[1]=="off"){
				//alert("off");
				clearTimeout(stagetimer);
			}else{
				para[2]=para[2].replace(" ","");
				newv=new Number(para[1]);			
				if(isNaN(newv)){newv=new Number(mygetCookie(para[1]));}
				stagetimer=window.setTimeout("goStage('"+para[2]+"');", (newv*1000) );
			}
		}

		if(ncmd=="save"){
			para[1]=para[1].replace(" ","");			
			
			if(para[1]=="off"){
				allowsave=false;
			}else if(para[1]=="on"){
				allowsave=true;
			}
		}
		
		if(ncmd=="bg"){
            if(para[1]!=null) para[1]=para[1].replace(" ","");
            if(para[2]!=null) para[2]=para[2].replace(" ","");
        
            var src="";
            for(var roomIdx=0; roomIdx<roomn; roomIdx++){
                for(var sceneIdx=0; sceneIdx<rooms[roomIdx].nscene; sceneIdx++){
                    if(rooms[roomIdx].scene[sceneIdx][0]==para[2] && rooms[roomIdx].name==para[1]){
                        src=rooms[roomIdx].scene[sceneIdx][1];
                        break;
                    }
                }
                if(src!="") break;
            }
        
            if(src!="" && String(src) == String(nowbgsrc)){
                layer[0] = src;
                displayer[0] = src;
                continue;
            }
        
            Bgshow(src);
        }
        
		if(ncmd=="effectlayer" ){
            if(para[1]!=null) para[1]=para[1].replace(" ","");
            if(para[2]!=null) para[2]=para[2].replace(" ","");
            if(para[3]!=null) para[3]=para[3].replace(" ","");
        
            if(para[1]=="off"){
                effectlayer("../transparent.png");
                effectlayer2("../transparent.png");
                effectlayer3("../transparent.png");
            }else{
                var elayer="1";
                if(para[3]!=null && para[3]!="") elayer=para[3];
        
                var src="";
                for(var roomIdx=0; roomIdx<roomn; roomIdx++){
                    for(var sceneIdx=0; sceneIdx<rooms[roomIdx].nscene; sceneIdx++){
                        if(rooms[roomIdx].scene[sceneIdx][0]==para[2] && rooms[roomIdx].name==para[1]){
                            src=rooms[roomIdx].scene[sceneIdx][1];
                            break;
                        }
                    }
                    if(src!="") break;
                }
        
                switch (elayer) {
                    case "3":
                        effectlayer3(src);
                        break;
                    case "2":
                        effectlayer2(src);
                        break;
                    default:
                        effectlayer(src);
                        break;
                }
            }
        }
		
		if(ncmd=="animation" ){
			para[1]=para[1].replace(" ","");	
			var mode=para[1];

			var step=0.6;
		
			if(mode=="off"){
				//alert("!");
				 changeshowtime=0;
				 changehidetime=0;
				 charfadeouttime=0;
				 charnewtime=0;
				 
				 bgchangehidetime=0;
				 bgchangeshowtime=0;
			
				optionshowtime=0;
			}
			if(mode=="fast"){
				 changeshowtime=changeshowtime*step;
				 changehidetime=changehidetime*step;
				 charfadeouttime=charfadeouttime*step;
				 charnewtime=charnewtime*step;

				 bgchangehidetime=bgchangehidetime*step;
				 bgchangeshowtime=bgchangeshowtime*step;
			}
			if(mode=="slow"){
				 changeshowtime=changeshowtime/step;
				 changehidetime=changehidetime/step;
				 charfadeouttime=charfadeouttime/step;
				 charnewtime=charnewtime/step;

				 bgchangehidetime=bgchangehidetime/step;
				 bgchangeshowtime=bgchangeshowtime/step;
			}
			if(mode=="on" || mode=="normal"){
				 changeshowtime=300;
				 changehidetime=300;
				 charfadeouttime=360;
				 charnewtime=480;

				 bgchangehidetime=100;
				 bgchangeshowtime=360;

				 optionshowtime=400;
			}
		}
		if(ncmd=="bgm" ){
			para[1]=para[1].replace(" ","");	
			var bgm=para[1];
			
			console.log('bgm command =', bgm);
			
            if (bgm=='resume') {
                bgmplaying=true;
                document.getElementById('musicplayer').play();
            } else if (bgm=='pause') {
                bgmplaying=false;
                document.getElementById('musicplayer').pause();
            } else {
			    loadMusicbyName(bgm);
            }
			
		}
		if(ncmd=="volume" ){
			para[1]=para[1].replace(" ","");			
			para[2]=para[2].replace(" ","");	
			//alert(para[1]);
			var volumm=para[1];
			var set_vol_time=para[2];

			now_volume=(volumm/10);	
			audio=$("#musicplayer");
			audio.animate({volume: now_volume}, set_vol_time*1000);
			
		}
		if(ncmd=="fadein" ){
			para[1]=para[1].replace(" ","");			
			//para[2]=para[2].replace(" ","");	
			//alert(para[1]);
			var fadein_sec=para[1];
			
			fadein_time=(fadein_sec*1000);				
		}
		if(ncmd=="bgeffect" ){

			para[1]=para[1].replace(" ","");	
			//alert(para[1]);
			var be=para[1];


			if(be=="黑白" ){
				bgeffect="Filter:Gray";
			}else if(be=="反白" ){
				bgeffect="Filter:Invert";
			}else if(be=="光暈" ){
				bgeffect="Filter:Glow(Color=skyblue,Strength=15)";
			}else if(be=="立體" ){
				bgeffect="Filter:Shadow(Color=orange,Direction=135)";
			}else if(be=="陰影" ){
				bgeffect="Filter:DropShadow(Color=navy,Positive=1,OffX=10,OffY=15)";
			}else if(be=="透明" ){
				bgeffect="透明";
			}else if(be=="變暗"){
				bgeffect="Filter:Alpha(Opacity=50,style=3)";
			}else if(be=="波浪" ){
				bgeffect="Filter:Wave(freq=3,lightstrength=30,phase=90,strength=8)";
			}else if(be=="模糊" ){
				bgeffect="Filter:Blur(Direction=135,Strength=8)";
			}else if(be=="x光" ){
				bgeffect="Filter:Xray";
			}else if(be=="相反" ){
				bgeffect="Filter:FlipH";
			}else if(be=="黑影" ){
				bgeffect="Filter:Light";	
			}else{
				bgeffect="";				
			}			
			
			Bgeffect();
		}
		if(ncmd=="fontcolor" ){
			para[1]=para[1].replace(" ","");	
			var color=para[1];
		
			if(color=="default"){
				color="#f1f1f1";			
			}
			if(!color.startsWith('#')){
				color="#f1f1f1";
			}
			defaultfontcolor=color;
			//alert(hexToRgb(color));
			//$("#story").css("color","rgba( "+hexToRgb(color).r+","+hexToRgb(color).g+","+hexToRgb(color).b+",0.9)" );
			init();
		}
		if(ncmd=="fulltellbgcolor" ){
			para[1]=para[1].replace(" ","");	
			var color=para[1];
		
			if(color=="default"){
				color="#000000";			
			}
			if(!color.startsWith('#')){
				color="#000000";
			}
			fulltellbgcolor=color;
			init();
		}
		if(ncmd=="fontsize" ){
			try{
				para[1]=para[1].replace(" ","");	
				var size=para[1];
			}catch(e){}
		
			if(size=="default"){
				size=defaultfontsize;			
				
			}
			if(size.indexOf("%")!=-1){
				var mag=size.substring(0,size.length-1);
				size=(mag/100)*defaultfontsize;
			}
			nowfontsize= size;//這邊的fontsize 沿用一開始的14~18原則 透過game中的fontsizebase轉換成em, 但對使用變數而言, 多數應該是用%
			init();
		}
		if(ncmd=="fontstyle" ){
			try{
				para[1]=para[1].replace(" ","");	
				var style=para[1];
			}catch(e){}
		
			if(style=="default"){
				style="normal";			
			}
			$("#story").css("font-style",style);
		}
		if(ncmd=="play"){
			//由名找src
			var ssrc="";
			for(j=0;j<sound.length;j++){
				if(sound[j][0]==para[1]) ssrc=sound[j][1];
			}
			loadEffect(ssrc);
		}
		if(ncmd=="give"){
			
			var items=mygetCookie("sys_item");
			para[1]=para[1].replace(" ","");			
			items+=para[1]+",";
			mysetCookie("sys_item",items);
			//alert(mygetCookie("sys_item"));
		}
		if(ncmd=="hidestory"){
			storystate();
		}

		if(ncmd=="giveone"){
			var items=mygetCookie("sys_item");
			para[1]=para[1].replace(" ","");		
			var have=false;
			items=items.split(",");
			for(var i=0;i<items.length;i++){
				items[i]=items[i].replace(" ","");
				if(items[i]==para[1]){
					have=true;
				}
			}

			if(!have){
				items+=para[1]+",";
				mysetCookie("sys_item",items);
			}
		}
		if(ncmd=="remove"){
			var items=mygetCookie("sys_item");
			para[1]=para[1].replace(" ","");		
			var re="";
			items=items.split(",");
			for(var y=0;y<items.length;y++){
				items[y]=items[y].replace(" ","");
				if(items[y]==para[1]){
					//donothing
				}else{
					if(items[y]!="")
					re+=items[y]+",";
				}
			}
			if(para[1]=="all") re="";
			mysetCookie("sys_item",re);
		}
		if(ncmd=="removeone"){
			var items=mygetCookie("sys_item");
			//alert(items);
			para[1]=para[1].replace(" ","");		
			var re="";
			var removed=false;
			items=items.split(",");
			for(var y=0;y<items.length;y++){
				items[y]=items[y].replace(" ","");
				if(items[y]==para[1] && !removed){
					//donothing
					removed=true;
				}else{
					if(items[y]!="")
					re+=items[y]+",";
				}
			}
			if(para[1]=="all") re="";
			mysetCookie("sys_item",re);
		}
		if(ncmd=="setv"){
			para[1]=para[1].replace(" ","");			
			para[2]=para[2].replace(" ","");				
			if(para[2].charAt(0)=="+" || para[2].charAt(0)=="-" || para[2].charAt(0)=="*" || para[2].charAt(0)=="/"){
				
				var nv=mygetCookie(para[1]);				
				if(para[2].charAt(0)=="+"){
					
					newv=new Number(para[2].substring(1,para[2].length));			
					if(isNaN(newv)){newv=new Number(mygetCookie(para[2].substring(1,para[2].length)));}
					nv= new Number(nv);
					nv+=newv;
				}
				if(para[2].charAt(0)=="-"){
					newv=new Number(para[2].substring(1,para[2].length));
					if(isNaN(newv)){newv=new Number(mygetCookie(para[2].substring(1,para[2].length)));}
					nv= new Number(nv);
					nv-=newv;
				}		
				if(para[2].charAt(0)=="*"){
					newv=new Number(para[2].substring(1,para[2].length));
					if(isNaN(newv)){newv=new Number(mygetCookie(para[2].substring(1,para[2].length)));}
					nv= new Number(nv);
					nv*=newv;
				}		
				if(para[2].charAt(0)=="/"){
					newv=new Number(para[2].substring(1,para[2].length));
					if(isNaN(newv)){newv=new Number(mygetCookie(para[2].substring(1,para[2].length)));}
					nv= new Number(nv);
					nv/=newv;
				}						
				mysetCookie(para[1],nv);
			}else{
					
					if(para[2]=="random"){
						mysetCookie(para[1],Math.random());
					}else
					if(para[2]=="round"){
						mysetCookie(para[1],Math.round(Number(mygetCookie(para[1]))));
					}else
					if(isNaN(para[2])){
						newv=new Number(mygetCookie(para[2]));
						mysetCookie(para[1],newv); 
					}else{ mysetCookie(para[1],para[2]);  }

			}
		}
		if(ncmd=="prob"){

			var num=para.length-1;
			//var out=Math.round(Math.random()*num);
			var out=Math.random()*num;
			//alert("a:"+out);
			for( var i=9;i>=0;i--){
				if(out>i) {out=i; break;}
			}
			//alert("B:"+out+":"+para[out+1]);
			if(para[out+1]!="none")
				goStage(para[out+1]);

			
				
		}
		if(ncmd=="cmp"){
			para[1]=mygetCookie(para[1].replace(" ",""));
			para[2]=mygetCookie(para[2].replace(" ",""));
			
			if(para[1]>para[2]){
				nextstage2=para[3].replace(" ","");
				if(nextstage2=="none")break;
				goStage(nextstage2);		
				break;
			}
			if(para[1]==para[2]){
				nextstage2=para[4].replace(" ","");
				if(nextstage2=="none")break;
				goStage(nextstage2);		
				break;
			}
			if(para[1]<para[2]){
				nextstage2=para[5].replace(" ","");
				if(nextstage2=="none")break;
				goStage(nextstage2);		
				break;
			}
		
		}
		if(ncmd=="setd"){
			var nv=mygetCookie(para[1].replace(" ",""));
			var cond=para[2].replace(" ","").substring(0,4);
			var nv2=para[2].replace(" ","").substring(4,para[2].replace(" ","").length);
			var nn=0;
			if(para[4]!=null) {
			    nn=para[4].replace(" ","");
			    if (!isNaN(nn) && !isNaN(parseInt(nn))) {if (parseInt(nn)>0) nn=parseInt(nn)-1;}
			}
			
			if(cond=="less"){		
				if(isNaN(nv2)){
					
					if(nv<new Number(mygetCookie(nv2))){
					    nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;			
					}
				}else{
					var condv=new Number(nv2);
					if(nv<condv) {
					    nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;
					}
				}
			}else if(cond=="more"){
				if(isNaN(nv2)){
					if(nv>new Number(mygetCookie(nv2))){
					    nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;			
					}
				}else{
			
					var condv=new Number(nv2);
							
					if(nv>condv) {
						nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;
					}
				}
			}else if(cond=="equa"){
				if(isNaN(nv2)){
					if(nv==new Number(mygetCookie(nv2))){
					    nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;			
					}
				}else{
					var condv=new Number(nv2);
					if(nv==condv) {
					    nextstage=para[3].replace(" ","");
						goStage(nextstage, null, nn);		
						break;
					}
				}
			}				
		}
		if(ncmd=="showv"){
			if(st.indexOf("@"+para[1]+"@")==-1) st+=" @"+para[1]+"@";
			var ii=1;//i外層有用到啦 

			while(para[ii]!=null){
				st=st.replace("@"+para[ii]+"@",(mygetCookie(para[ii])*1).toFixed(0));
				ii++;
			}

			if(delaytime==0) {
				tell(st); //如果沒有delay tell完還沒跑到cmd
			}
		}
		if(ncmd=="emphasise"){
			var ii=1;//i外層有用到啦 

			while(para[ii]!=null){
			    if (st.indexOf("(emp"+ii+")")==0) {
			        st=st.replaceAll("(emp"+ii+")","   <a style='color:"+para[ii]+"\;'>"); //如果emp放在一開始會因為系統設計會先顯示首3字元導致文本多出額外符號
				    st=st.replaceAll("(/emp"+ii+")","</a>");
			    } else {
				    st=st.replaceAll("(emp"+ii+")","<a style='color:"+para[ii]+"\;'>");
				    st=st.replaceAll("(/emp"+ii+")","</a>");
			    }
			    ii++;
			}

			if(delaytime==0) {
				tell(st); //如果沒有delay tell完還沒跑到cmd
			}
		}	
		
		if(ncmd=="clearscreen"){
			layer[1]="";
			layer[2]="";
			layer[3]="";
			paintChar();
		}	

		if(ncmd=="showitem"){
			para[1]=para[1].replace(" ","");			
			descItem(para[1]);
		}	

		if(ncmd=="hideitem"){
			//para[1]=para[1].replace(" ","");			
			descItem("999");
		}	
        
        function tcmove(slot, p2, p3, p4) {
            var tc = getSlotTarget(slot);
            if (!tc) return;
        
            ensureSlotInited(slot);
        
            var sec = parseFloat(p4);
            if (isNaN(sec)) sec = 0;
        
            var waitMs = Math.min(200, Math.max(0, Math.ceil(sec) * 200));
        
            var targetTx, targetTy;
        
            if (p2 == "default") {
                targetTx = '0%';
                targetTy = '0%';
        
                if (sec > 0) {
                    fxState[slot].pendingMoveTx = targetTx;
                    fxState[slot].pendingMoveTy = targetTy;
        
                    startOneStageFx(
                        slot,
                        tc,
                        waitMs,
                        sec,
                        buildTransformFromState(slot, { tx: targetTx, ty: targetTy }),
                        getCurrentClipPath(tc),
                        function () {
                            fxState[slot].tx = targetTx;
                            fxState[slot].ty = targetTy;
                            fxState[slot].pendingMoveTx = null;
                            fxState[slot].pendingMoveTy = null;
                        }
                    );
                } else {
                    fxState[slot].tx = targetTx;
                    fxState[slot].ty = targetTy;
                    fxState[slot].pendingMoveTx = null;
                    fxState[slot].pendingMoveTy = null;
                    applyCurrentStateInstant(slot);
                    if (telling) telling = false;
                }
                return;
            }
        
            var xPct = parseFloat(p2);
            var yPct = parseFloat(p3);
        
            if (isNaN(xPct) || isNaN(yPct)) return;
        
            targetTx = xPct + '%';
            targetTy = yPct + '%';
        
            // 關鍵：不要在動畫尚未開始前就覆寫目前位置
            if (sec > 0) {
                fxState[slot].pendingMoveTx = targetTx;
                fxState[slot].pendingMoveTy = targetTy;
        
                startOneStageFx(
                    slot,
                    tc,
                    waitMs,
                    sec,
                    buildTransformFromState(slot, { tx: targetTx, ty: targetTy }),
                    getCurrentClipPath(tc),
                    function () {
                        fxState[slot].tx = targetTx;
                        fxState[slot].ty = targetTy;
                        fxState[slot].pendingMoveTx = null;
                        fxState[slot].pendingMoveTy = null;
                    }
                );
            } else {
                fxState[slot].tx = targetTx;
                fxState[slot].ty = targetTy;
                fxState[slot].pendingMoveTx = null;
                fxState[slot].pendingMoveTy = null;
                applyCurrentStateInstant(slot);
                if (telling) telling = false;
            }
        }
        
        if (ncmd == "move") {
            para[1] = trimAllSpace(para[1]);
            para[2] = trimAllSpace(para[2]);
            if (para[3] != null) para[3] = trimAllSpace(para[3]);
            if (para[4] != null) para[4] = trimAllSpace(para[4]);
        
            if (
                para[2] == "default" ||
                (
                    para[3] != null &&
                    !isNaN(parseFloat(para[2])) &&
                    !isNaN(parseFloat(para[3])) &&
                    !isNaN(parseFloat(para[4]))
                )
            ) {
                tcmove(para[1], para[2], para[3], para[4]);
            }
        }
        
        function tcjump(slot) {
            var tc = getSlotTarget(slot);
            if (!tc) return;
        
            ensureSlotInited(slot);
        
            var jumpHeight = tc.height() * 0.05;
        
            var midTransform = buildTransformFromState(slot, {
                addY: -jumpHeight
            });
        
            var finalTransform = buildTransformFromState(slot);
        
            startTwoStageFx(
                slot,
                tc,
                200,
                0.2,
                midTransform,
                0.2,
                finalTransform,
                getCurrentClipPath(tc)
            );
        }
        
        if(ncmd=="jump"){
            para[1] = trimAllSpace(para[1]);
            tcjump(para[1]);
        }
        
        function tcflip(slot, p2) {
            var tc = getSlotTarget(slot);
            if (!tc) return;
        
            p2 = trimAllSpace(p2);
        
            // 先把這個 slot 正在進行的 FX 收束
            finishFx(slot);
        
            setTimeout(function () {
                var flip = 1;
                if (p2 == 'on') {
                    flip = -1;
                    fxState[slot].flipX = -1;
                } else if (p2 == 'off') {
                    flip = 1;
                    fxState[slot].flipX = 1;
                } else {
                    return;
                }
        
                var raw = getRawMatrixParts(tc);
        
                var TX = raw.tx;
                var TY = raw.ty;
                var SX = Math.abs(raw.sx) || 1;
                var SY = Math.abs(raw.sy) || 1;
        
                var finalTransform = 'translate(' + TX + 'px,' + TY + 'px) scale(' + (SX * flip) + ',' + SY + ')';
        
                // 這次 flip 也記進 fxState，讓 finishAllFx() 能正確收束
                fxState[slot].running = true;
                fxState[slot].started = true;
                fxState[slot].target = tc;
                fxState[slot].finalTransform = finalTransform;
                fxState[slot].finalClip = getCurrentClipPath(tc);
        
                clearFxTimers(fxState[slot]);
        
                tc.css({
                    '-webkit-transform': finalTransform,
                    '-moz-transform': finalTransform,
                    '-o-transform': finalTransform,
                    'transform': finalTransform,
                    '-o-transition': 'all 0.2s ease-in-out',
                    '-webkit-transition': 'all 0.2s ease-in-out',
                    '-moz-transition': 'all 0.2s ease-in-out',
                    'transition': 'all 0.2s ease-in-out'
                });
        
                fxState[slot].endTimer = setTimeout(function () {
                    // 動畫完後，把實際 DOM 狀態同步回 state
                    ensureSlotInited(slot);
        
                    fxState[slot].running = false;
                    fxState[slot].started = false;
                    fxState[slot].finalTransform = '';
                    fxState[slot].finalClip = 'none';
        
                    if (telling) telling = false;
                }, 200);
        
            }, 200);
        }
        
        if(ncmd=="flip"){
            if (!telling) telling = true;

            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
        
            tcflip(para[1], para[2]);

        }
        
        function tcscale(slot, p2, p3) {
            var tc = getSlotTarget(slot);
            if (!tc) return;
        
            syncFxStateFromDom(slot, tc);
        
            p2 = parseFloat(p2);
            p3 = parseFloat(p3);
        
            if (isNaN(p2)) p2 = 1;
            if (isNaN(p3)) p3 = 0;
        
            fxState[slot].scaleAbs = p2;
        
            startOneStageFx(
                slot,
                tc,
                200,
                p3,
                buildTransformFromState(slot),
                getCurrentClipPath(tc)
            );
        }
        
        if(ncmd=="scale"){
            if(!telling) telling=true;
            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
            if (para[3] != null) para[3] = trimAllSpace(para[3]);
        
            tcscale(para[1], para[2], para[3]);

        }
        
		if(ncmd=="front"){
			//para[1]=para[1].replace(" ","");			
			if (para[1]!=null) {
			    clayer=para[1].replace(" ","");
			    switch (clayer) {
				    case "l":
				        $("#charleft").css({'z-index': 4});
				        $("#charright").css({'z-index': 3});
				        $("#charcenter").css({'z-index': 3});
				        if (para[2]!=null) {
				            para[2]=para[2].replace(" ","");
				            if (para[2] == "c") {
				                $("#charright").css({'z-index': 2});
				                $("#charcenter").css({'z-index': 3});
				            } else if (para[2] == "r") {
				                $("#charright").css({'z-index': 3});
				                $("#charcenter").css({'z-index': 2});
				            }
				        }
				        break;
				    case "r":
				        $("#charright").css({'z-index': 4});
				        $("#charleft").css({'z-index': 3});
				        $("#charcenter").css({'z-index': 3});
				        if (para[2]!=null) {
				            para[2]=para[2].replace(" ","");
				            if (para[2] == "c") {
				                $("#charleft").css({'z-index': 2});
				                $("#charcenter").css({'z-index': 3});
				            } else if (para[2] == "l") {
				                $("#charleft").css({'z-index': 3});
				                $("#charcenter").css({'z-index': 2});
				            }
				        }
				        break;
                    case "c":
				        $("#charcenter").css({'z-index': 4});
				        $("#charleft").css({'z-index': 3});
				        $("#charright").css({'z-index': 3});
				        if (para[2]!=null) {
				            para[2]=para[2].replace(" ","");
				            if (para[2] == "r") {
				                $("#charleft").css({'z-index': 2});
				                $("#charright").css({'z-index': 3});
				            } else if (para[2] == "l") {
				                $("#charleft").css({'z-index': 3});
				                $("#charright").css({'z-index': 2});
				            }
				        }
				        break;
				    default:
				        $("#charleft").css({'z-index': 3});
				        $("#charright").css({'z-index': 3});
				        $("#charcenter").css({'z-index': 4});
				}
			    
			    
			}
		}
		
		if(ncmd=="ytvideo"){
			para[1]=para[1].replace(" ","");
			document.getElementById('musicplayer').pause();
			youtubeDone = false;
			disableClick();
			$("#storyframe").css({'display': 'none'});
			$("#player").css({'display': 'block'});
			player.loadVideoById({
			    'videoId': para[1],
                'startSeconds': 0,
			});
		}
		
		if(ncmd=="wait"){
			para[1] = String(para[1] || '').replace(/\s+/g, '');
            para[1] = parseFloat(para[1]) || 0;
        
            waiting = true;
            disableClick();
            showWaitIndicator();
        
            setTimeout(function () {
                waiting = false;
                hideWaitIndicator();
                enableClick();
        
                tellStory();
            }, 1000 * para[1]);
        
            //return;
		}
		
		function tcshake(slot, p2, p3) {
            var $el = getSlotTarget(slot);
            if (!$el) return;
        
            ensureSlotInited(slot);
            finishFxIfRunning(slot);
        
            var state = fxState[slot];
            state.shakeAmpX = parseFloat(p2);
            if (isNaN(state.shakeAmpX)) state.shakeAmpX = 8;
        
            state.shakeAmpY = Math.max(2, state.shakeAmpX * 0.35);
        
            var sec = parseFloat(p3);
            if (isNaN(sec)) sec = 0.14;
        
            state.shakeDur = sec * 1000;
            state.shakeStart = performance.now();
            state.shakeUntil = state.shakeStart + state.shakeDur;
        
            ensureAmbientLoop();
        }
        
        function tctremble(slot, p2, p3) {
            var $el = getSlotTarget(slot);
            if (!$el) return;
        
            ensureSlotInited(slot);
            finishFxIfRunning(slot);
        
            var state = fxState[slot];
            p2 = trimAllSpace(p2);
        
            if (p2 == 'on') {
                state.trembleOn = true;
        
                var amp = parseFloat(p3);
                if (!isNaN(amp)) {
                    state.trembleAmpX = amp;
                    state.trembleAmpY = amp * 0.55;
                }
        
                ensureAmbientLoop();
            } else if (p2 == 'off') {
                state.trembleOn = false;
                if (!state.breathOn && !state.floatOn && state.shakeUntil <= 0) {
                    resetMicroMotion(slot);
                    applyCurrentStateInstant(slot);
                }
            }
        }
        
        function tcbreath(slot, p2) {
            var $el = getSlotTarget(slot);
            if (!$el) return;
        
            ensureSlotInited(slot);
            finishFxIfRunning(slot);
        
            var state = fxState[slot];
            p2 = trimAllSpace(p2);
        
            if (p2 == 'on') {
                state.breathOn = true;
                ensureAmbientLoop();
            } else if (p2 == 'off') {
                state.breathOn = false;
                if (!state.trembleOn && !state.floatOn && state.shakeUntil <= 0) {
                    resetMicroMotion(slot);
                    applyCurrentStateInstant(slot);
                }
            }
        }
        
        function tcfloat(slot, p2, p3) {
            var $el = getSlotTarget(slot);
            if (!$el) return;
        
            ensureSlotInited(slot);
            finishFxIfRunning(slot);
        
            var state = fxState[slot];
            p2 = trimAllSpace(p2);
        
            if (p2 == 'on') {
                state.floatOn = true;
        
                var amp = parseFloat(p3);
                if (!isNaN(amp)) {
                    state.floatAmpY = amp;
                }
        
                ensureAmbientLoop();
            } else if (p2 == 'off') {
                state.floatOn = false;
                if (!state.trembleOn && !state.breathOn && state.shakeUntil <= 0) {
                    resetMicroMotion(slot);
                    applyCurrentStateInstant(slot);
                }
            }
        }
        
        if (ncmd == "shake") {
            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
            if (para[3] != null) para[3] = trimAllSpace(para[3]);
        
            tcshake(para[1], para[2], para[3]);
        }
        
        if (ncmd == "tremble") {
            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
            if (para[3] != null) para[3] = trimAllSpace(para[3]);
        
            tctremble(para[1], para[2], para[3]);
        }
        
        if (ncmd == "breath") {
            if (!telling) telling = true;
            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
        
            tcbreath(para[1], para[2]);
        }
        
        if (ncmd == "float") {
            if (!telling) telling = true;
            para[1] = trimAllSpace(para[1]);
            if (para[2] != null) para[2] = trimAllSpace(para[2]);
            if (para[3] != null) para[3] = trimAllSpace(para[3]);
        
            tcfloat(para[1], para[2], para[3]);
        }
	}
	//alert("finish");
	cmding=false;
	
}

function youtubeend(){
    if (youtubeDone) {
        $("#player").css({'display': 'none'});
        $("#storyframe").css({'display': 'block'});
    	tellStory();
    	document.getElementById('musicplayer').play();
    	enableClick();
        youtubeDone = false;
    }
}



//=================end sys function ============================//


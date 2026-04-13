
// system setup
var dimx=620;
var dimy=380;
var sound=new Array(); // [][0]name [][1] src for all sound of the game
var expr= new Array(new Array("","")); //[][0]naem [][1]expr
var stageexpr=new Array(new Array("",""));
var imgloadlist="";// 用來preload所有媒體用的, 目前只有圖片 要加聲音
var wavloadlist="";
var item=new Array( new Array("","","","") ); //picsrc, name,desc, soundsrc
//stage setup

var stagename=firststage;//stage的名稱
var oldstage="";//previous stage
var nextstage="?";// name or ? = have options 
var roomname="";// 目前room 的名稱 , 沒什麼用//有用了, 如果新房間是透明的, 就是套用現在的
var roomsound=new Array("","");//roomsound name ,src
var music=new Array("",""); //music of this stage's name, SRC
var lastmusic="old_old";
var layer= new Array("","","","","",""); // room 0 in table, char 123  item 4 move 5
var desc=new Array("","","","","",""); //
var chars=new Array(1); 
/*
chars[]{
	name
	desc
	//sound
	face[]=(name, src, soundsrc)
	nface
}
*/
var rooms=new Array(1);
var roomn=0;
var soundn=0;
var exprn=0;
var itemn=0;
var charn=0;
/*
rooms[]{
	name
	scene[]={name,src}
	nscene
}
*/
var script=new Array(20);// load story
var scriptlength=0;//length of story lines
var option=new Array("","","",""); //talk , use, move, select 
var itemdest=new Array(new Array("","","","",""));///item pic src, name, desc, destnum, soundsrc[0]-[5]
//var scenedest=new Array(new Array("","","","",""));///room pic src, name, desc, destnum, soundsrc, room name
var dest=new Array(new Array("",""));//dest, phrase
var areadest=new Array(new Array("","",""));//pos num, dest


function off_Music(){	
		document.all.music.innerHTML="<embed src='' hidden=true autostart=true loop=true>";
		document.all.dummyspan2.innerHTML="<embed src='' hidden=true autostart=true loop=false>";
}

//for expr if no then for stage expr
function lookupexpr(ob){
	var re="";
	for (i=0;i<stageexpr.length ;i++ ){
		if(stageexpr[i][0]==ob) re=stageexpr[i][1];
	} 
	if(re=="") 
	for (i=0;i<expr.length ;i++ ){
		if(expr[i][0]==ob) re=expr[i][1];
	}
	if(re=="") re=ob;	

	return re;
}

function getName(src){//give face src get face name
//if(uid=='lazi') alert(src);
	//if(src=="") return;
 	var re="";
	for(i=0;i<chars.length;i++)
	for(j=0;j<chars[i].face.length;j++){
		try {
		if(chars[i].face[j][1]==src) re=chars[i].name;
		}catch(err){
		}
	}
	return re;
}


function save(){
	if(cs.length>4000 ) alter("var too long");

	if(!allowsave){
		alert("目前禁止存檔喔");
		return;
	}

	if(uid==""){
	
		setCookie(gid , cs );
		setCookie(gid+"s" , stagename  );
		setCookie(gid+"n" , nowstory  );
		alert("Save ok! 註冊登入可進行更長久的跨平台存檔\n");
	}else{
		//alert("Save ok\n"+stagename+":"+nowstory);
		setCookie(gid , cs );
		setCookie(gid+"s" , stagename  );
		setCookie(gid+"n" , nowstory  );
		document.getElementById("sstage").value=stagename;
		document.getElementById("sline").value=nowstory;
		document.getElementById("svars").value=cs;
		document.getElementById("autosave").value="no";
		window.setTimeout("submit();", 300 );
	}
}



function goodword(w){
		document.getElementById("n").value="遊戲:"+gamename+":"+w+":"+uid;
		
		window.setTimeout("submit2();", 300 );
		alert("感謝鼓勵");
}


function save2(){
	if(cs.length>4000 ) alter("var too long");
	if(uid==""){
	
		setCookie(gid , cs );
		setCookie(gid+"s" , stagename  );
		setCookie(gid+"n" , nowstory  );
		setCookie(gid+"sf" , "0");
	}else{
		setCookie(gid , cs );
		setCookie(gid+"s" , stagename  );
		setCookie(gid+"n" , nowstory  );
		setCookie(gid+"sf" , "0");
		document.getElementById("sstage").value=stagename;
		document.getElementById("sline").value=nowstory;
		document.getElementById("svars").value=cs;
		document.getElementById("autosave").value="yes";
		document.getElementById("saveid").value= "0";
		window.setTimeout("submit();", 300 );
		window.setTimeout('refreshsave3();', 2000);
	}
}

function save3(n){
    setCookie(gid+"sf" , n);
    document.getElementById("saveid").value = n;
    save();
    window.setTimeout('refreshsave3();', 2000);
}

function refreshsave3() {
    $.ajax({
            type: 'POST',
            url: '../game_loadsaveinterface.php ',
            data:{action: 'refresh', id: gid},
            success: function(result) {
                $("#game-savefile").html(result);
            }
    });
}

function submit(){
		document.saveform.submit();
}
function submit2(){
		document.goodwordform.submit();
}


function load(){
	alert("讀取進度");
	load2();
}

function loadSaveData(gid, saveFileNumber) {
    setCookie(gid+"sf", saveFileNumber);
    $.ajax({
            type: 'POST',
            url: '../game_loadsavefile.php',
            data:{action:'call_this', id: gid},
            success: function(result) {
            $("#dummy").html(result);
            }
    });
    //load();
    return false;
}

function load2(){//給指令load使用 不顯示alert


	
	if(getCookie(gid)=="" | getCookie(gid+"s")=="" | getCookie(gid+"n")=="") return;
	cs=getCookie(gid);



	if(debug=="true") alert(cs);


	stagename=getCookie(gid+"s");
			layer[1]="";
			layer[2]="";
			layer[3]="";
			paintChar();
			document.all.music.innerHTML="";
			nowstory=getCookie(gid+"n");
	
		$("#option-container").fadeOut();
		$("#option-container").html("");
		asking=false;
		lastmusic="";
		fadingchar=false;
		loadData();
}


var cs="";// tmp cookie in memory
function mysetCookie(n,v){//name, value
	//name:value|| n:v...
//	var cs=document.cookie;
	var cookies=cs.split("||");
	cs="";
	var exist=false;

	for(var z=0;z<cookies.length;z++){
		//alert("!!!:"+cookies[i]);
		var oc=cookies[z].split(":");
		if(oc[0]==n){
			cookies[z]=oc[0]+":"+v;
			exist=true;
		}

		if(cookies[z]!="")
		cs+=cookies[z]+"||";
	}

	if(!exist){
		cs+=n+":"+v;
	}
//	document.cookie=cs;
	//alert(document.cookie);
}

function saveCookie(){
}

function loadCookie(){
}
//set /get wont really set cookie, just keep in memory

function mygetCookie(n){
//	var cs=document.cookie;
//alert(cs);
	var cookies=cs.split("||");
	var exist=false;
	var re="";

	for(var i=0;i<cookies.length;i++){
		var oc=cookies[i].split(":");
		if(oc[0]==n){
			re=oc[1];
		}
	}
	return re;
}

var haveclear=false;
function clearCookie(){
	if(haveclear) return;
	cs=" ";
	haveclear=true;

	//document.cookie="";
}

function clearSelection () {
	if (document.selection)
	document.selection.empty();
	else if (window.getSelection)
	window.getSelection().removeAllRanges();
}


//============copy from http://www.quirksmode.org/dom/importxml.html====================//
/*
var oxmlDom="";
var xmlDoc="";
function importXML(src)
{
	if (window.ActiveXObject)
	{
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.onreadystatechange = function () {if (xmlDoc.readyState == 4) loadData()};
		xmlDoc.load(src);
	}
	else
	if (document.implementation && document.implementation.createDocument)
	{
		xmlDoc = document.implementation.createDocument("", "", null);
		xmlDoc.onload = loadDataFF;
		xmlDoc.load(src);		
	}
	else
	{
		alert('Your browser can\'t handle this script');
		return;
	}
}
*/
//====================== 
loadXML = function(fileRoute){
    xmlDoc=null;
     if (window.ActiveXObject){
        xmlDoc = new ActiveXObject('Msxml2.DOMDocument');
        xmlDoc.async=false;
        xmlDoc.load(fileRoute);
    }
    else if (document.implementation && document.implementation.createDocument){
        var xmlhttp = new window.XMLHttpRequest();
        xmlhttp.open("GET",fileRoute,false);
        xmlhttp.send(null);
        var xmlDoc = xmlhttp.responseXML.documentElement; 
    }
    else {xmlDoc=null;}
    return xmlDoc;
}

var xmlDoc=null;

function importXML(src){
	xmlDoc=loadXML(src);
	if (document.implementation && document.implementation.createDocument){
		firefox=true;
	}
	//alert(xmlDoc.getElementsByTagName("room")[0].getAttribute("name"));

	window.setTimeout("loadData();", 1000 );

	
}
/*
var cNodes = xmlDoc.getElementsByTagName("book"); //alert(cNodes.length)
 var bookID=xmlDoc.getElementsByTagName("book")[j].getAttribute("id");
  var sortID=xmlDoc.getElementsByTagName("book")[j].getAttribute("sortID");
    var bookTitle=xmlDoc.getElementsByTagName("title")[j].childNodes[0].nodeValue;
    var bookAuthor=xmlDoc.getElementsByTagName("author")[j].childNodes[0].nodeValue;
	*/
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function stopevent(evt){
	if(evt==null) return;
    var e=(evt)?evt:window.event;
  if (window.event) {
      e.cancelBubble=true;
  } else {
     e.stopPropagation();
  }
}
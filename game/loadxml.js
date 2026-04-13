var loadnum=0;
var charloadnum=0;
var bgloadnum=0;
var loadnums=0;
var stagen=0;
var loadset;
var loadlist_a = new Array();
var loadlist_an=0;
var nowloading_num=0;
var firefox=false;


//var defaultfontsize="18pt";
var displayer=new Array("","","","");//用這個來當作真正顯示的網址 可以用來分流 

function loadData(){

if(stagename==firststage && !gamestart){

	clearCookie();

	dimx=620;
	dimy=380;

	var roomnode=xmlDoc.getElementsByTagName("room");
	for(i=0;i<roomnode.length;i++){
		if(roomnode[i].parentNode.tagName=="game"){

						rooms[roomn]=new Object();
						rooms[roomn].name=roomnode[i].getAttribute("name");
						rooms[roomn].nscene=0;
						rooms[roomn].scene=new Array(1);

						for(k=0;k<roomnode[i].childNodes.length;k++){
							if(roomnode[i].childNodes[k].tagName=="scene"){								
								rooms[roomn].scene[rooms[roomn].nscene]=new Array(roomnode[i].childNodes[k].getAttribute("name"),roomnode[i].childNodes[k].getAttribute("src"));							
								rooms[roomn].nscene+=1
	
								bgloadnum++;
							}
						}
						roomn++;
		}
	}//for roomnodes

	var charnode=xmlDoc.getElementsByTagName("char");
	for(i=0;i<charnode.length;i++){
		if(charnode[i].parentNode.tagName=="game"){

						chars[charn]=new Object();
						chars[charn].name=charnode[i].getAttribute("name");
						chars[charn].desc=charnode[i].getAttribute("desc");
						chars[charn].nface=0;
						chars[charn].face=new Array(1);
	
						for(k=0;k<charnode[i].childNodes.length;k++){
							if(charnode[i].childNodes[k].tagName=="face"){
								var soundsrc="";
								if(charnode[i].childNodes[k].childNodes.length>0){
									soundsrc=charnode[i].childNodes[k].childNodes[0].getAttribute("src");
								}
								
								chars[charn].face[chars[charn].nface]=new Array(charnode[i].childNodes[k].getAttribute("name"),charnode[i].childNodes[k].getAttribute("src"),soundsrc);							
								chars[charn].nface+=1
					
								if(0){
									loadlist_a[loadlist_an]="<img width=5 height=5 onload=\"loadnext("+loadlist_an+");\" src="+charnode[i].childNodes[k].getAttribute("src")+"></img>";
									loadlist_an++;		
									charloadnum++;
								}
							}


						}
						charn++;

		}
	}//for charnode 

	var soundnode=xmlDoc.getElementsByTagName("sound");
	for(i=0;i<soundnode.length;i++){
		if(soundnode[i].parentNode.tagName=="game"){

			sound[soundn]=new Array(soundnode[i].getAttribute("name"),soundnode[i].getAttribute("src"));
			soundn++;
			ssrc=soundnode[i].getAttribute("src");
			
			if(0){
				wavloadlist+="<embed src="+ssrc+" id="+soundnode[i].getAttribute("name")+" hidden=\"true\" autostart=\"false\" >";
				loadnums++;
			}
		}
	}//for soundnodes
	
	var exprnode=xmlDoc.getElementsByTagName("expr");
	for(i=0;i<exprnode.length;i++){
		if(exprnode[i].parentNode.tagName=="game"){
			expr[exprn]=new Array(exprnode[i].getAttribute("type"),exprnode[i].childNodes[0].nodeValue);
			exprn++;
		}
	}//for exprnode

	var itemnode=xmlDoc.getElementsByTagName("item");
	for(i=0;i<itemnode.length;i++){
		if(itemnode[i].parentNode.tagName=="game"){

			if(0){
				loadlist+="<img width=0 height=0 src="+itemnode[i].getAttribute("src")+"></img>";
			}
			var soundsrc="";
			/*
			if(itemnode[i].childNodes.length>0)
				soundsrc=itemnode[i].childNodes[0].getAttribute("src");
				//item聲音也可以取消
			*/
			item[itemn]=new Array(itemnode[i].getAttribute("src"),itemnode[i].getAttribute("name"),itemnode[i].getAttribute("desc"),soundsrc);
			itemn++;

		}
	}//for itemnode

	var stagenode=xmlDoc.getElementsByTagName("stage");
	for(i=0;i<stagenode.length;i++){
		if(stagenode[i].parentNode.tagName=="game"){
			stagen++;
		}
	}//for stagenode


	storystate();
	if(0){
		document.getElementsByTagName("div")["load"].innerHTML=loadlist_a[0];	
	}


}//if stage==start

//==================end of load system media===================//
	
	//stage setup
	var stagenode=xmlDoc.getElementsByTagName("stage");
	for(i=0;i<stagenode.length;i++){	

		if( stagenode[i].getAttribute("name")==stagename){
			
				var stage=stagenode[i];
				nextstage=stage.getAttribute("next");
				if(nextstage=="goback"){
					nextstage=oldstage;
				}
				if(stagename=="end") nextstage="";

				var noption=0;
				var nitemdest=0;
				var destn=0;
				var nexpr=0;
				stageexpr=new Array(new Array("",""));
				var nareadest=0;
				for(var ii=0;ii<4;ii++)
				option[ii]=new Array("","");		
				for(var ii=0;ii<dest.length;ii++)
				dest[ii]=new Array("","");
		
				for(j=0;j<stage.childNodes.length;j++){

							if(stage.childNodes[j].tagName=="room"){
									//alert(stage.childNodes[j].childNodes[1].tagName);
									for(k=0;k<stage.childNodes[j].childNodes.length;k++){
									if(stage.childNodes[j].childNodes[k].tagName==="scene"){
										if(stage.childNodes[j].childNodes[k].getAttribute("name")=="transparent"){
											//donothing!
											//nextstage=oldstage;
										}else{
											layer[0]=stage.childNodes[j].childNodes[k].getAttribute("src");
											roomname=stage.childNodes[j].childNodes[k].getAttribute("name");
										}

										/*2012/1/15 room sound 應該可以廢除了?
										if(stage.childNodes[j].childNodes[k].childNodes.length>0)
											roomsound=new Array(stage.childNodes[j].childNodes[k].childNodes[0].getAttribute("name"),stage.childNodes[j].childNodes[k].childNodes[0].getAttribute("src"));
										else roomsound=("","");
										*/
									}
									}							
							}
							if(stage.childNodes[j].tagName=="char"){
							}
							if(stage.childNodes[j].tagName == "sound"){
								music=new Array(stage.childNodes[j].getAttribute("name"),stage.childNodes[j].getAttribute("src"));
							}
							if(stage.childNodes[j].tagName=="story"){
								try{
								var s=stage.childNodes[j].childNodes[0].nodeValue;
								}catch(e){s="";}
								script=s.split("\n");
								scriptlength=script.length;
								//if(script[0].replace(" ","")=="") scriptlength=0;//2015/11/1 取消 不知道為何當初要有這樣 這樣會導致第一行空白舞台直接跳到最後
							}
							if(stage.childNodes[j].tagName=="expr"){
								try{
									stageexpr[nexpr]=new Array(stage.childNodes[j].getAttribute("type"),stage.childNodes[j].childNodes[0].nodeValue);
								}catch(e){
									stageexpr[nexpr]=new Array(stage.childNodes[j].getAttribute("type"),"");
								}
								nexpr++;
							}
							if(stage.childNodes[j].tagName=="option"){
								try{
									option[noption]=new Array(stage.childNodes[j].getAttribute("type"),stage.childNodes[j].childNodes[0].nodeValue);		
								}catch(e){
									option[noption]=new Array(stage.childNodes[j].getAttribute("type"),"");		
								}
								noption++;
							}
							if(stage.childNodes[j].tagName=="areadest"){
								try{
									areadest[nareadest]=new Array(stage.childNodes[j].getAttribute("pos"),stage.childNodes[j].getAttribute("dest"),stage.childNodes[j].childNodes[0].nodeValue);		
								}catch(e){
									areadest[nareadest]=new Array(stage.childNodes[j].getAttribute("pos"),stage.childNodes[j].getAttribute("dest"),"");//沒有node0會error
								}
								//alert("destarea:"+areadest[nareadest]);
								nareadest++;
							}
							if(stage.childNodes[j].tagName=="itemdest"){
								for(k=0;k<stage.childNodes[j].childNodes.length;k++){
								if(stage.childNodes[j].childNodes[k].tagName==="item"){
									var soundsrc="";

									/*//item的聲音應該是最有保留效益的 但現行中 其實沒支援???
									if(stage.childNodes[j].childNodes[k].childNodes.length>0)
										soundsrc=stage.childNodes[j].childNodes[k].childNodes[0].getAttribute("src");
									*/		
									itemdest[nitemdest]=new Array(stage.childNodes[j].childNodes[k].getAttribute("src"),	stage.childNodes[j].childNodes[k].getAttribute("name"), stage.childNodes[j].childNodes[k].getAttribute("desc"), stage.childNodes[j].getAttribute("dest"), soundsrc);
									//alert("item"+itemdest[nitemdest]);
									nitemdest++;//item pic src, name, desc, destnum, soundsrc
								}
								}
							}
							if(stage.childNodes[j].tagName=="dest"){
								try{
									dest[destn]=new Array(stage.childNodes[j].getAttribute("dest"), stage.childNodes[j].childNodes[0].nodeValue);
								}catch(e){	
									dest[destn]=new Array(stage.childNodes[j].getAttribute("dest"), "");
								}
								destn++;
							}
				
				
				}//for 處理每個stage中的 資訊
			
		}		
	}



	
		//window.setTimeout("loadRoomeffect();", 0 );取消的功能

		loadMusic();

		paintNewroomBg();//if(0)裡面的是預load用的 現在一律直接開始節省頻寬

}


/*used when the img cannot be loaded and timeout*/
var told_unexisted=0;
var load_unexisted="";
function loadnext_no_img(now){
	if(now<nowloading_num) return;
	if(stop_showing) return;

	load_unexisted+=loadlist_a[now];
	now++;
	loadnext(now);
	if(told_unexisted==0){
		//alert("本遊戲可能有素材空缺, 請通知作者盡快修補!");
		if(storyhide) storystate();
		document.getElementsByTagName("p")["story"].innerHTML ="遊戲準備開始...";
		told_unexisted=1;
	}
}

function loadnext(now){
		//alert("loadnext");
	if(stop_showing) return;

	now++;
	document.getElementsByTagName("div")["load"].innerHTML=loadlist_a[now];	
	nowloading_num++;
	//alert(now+":"+nowloading_num);
	window.setTimeout("loadnext_no_img("+now+");", 20000 );

	if(now==1) showloading();
	if(nowloading_num>=loadlist_an || now>0){
		document.getElementsByTagName("div")["load"].innerHTML="";
		newroomdelay=1000;
		stop_showing=true;
		paintNewroomBg();

	}
}

var nowcolor=999999;
var color_down=true;
var stop_showing=false;
function showloading(){
	if(!stop_showing){
		window.setTimeout("showloading();", 150 );
	}
	else{
		document.getElementsByTagName("div")["bg"].innerHTML="";
		return;
	}

	if(color_down){
		nowcolor-=111111;
	}else{
		nowcolor+=111111;
	}
	if(nowcolor<333333) color_down=false;
	if(nowcolor>888888) color_down=true;

	document.getElementsByTagName("div")["bg"].innerHTML="<br><br><br><br><center><img width=300 src='../games/cover/"+gamecover+"' style='Filter:Alpha(Opacity="+(20+((nowloading_num*100)/loadlist_an))+",style=3)'/><br><br><font color="+nowcolor+" size=5><b>內容下載中 : "+nowloading_num+"/"+loadlist_an+"</b></font><br><br><a href=# onclick=\"start_now();\"><font size=3 color=#aaaaaa >馬上開始</a></center>";

}


function start_now(){
		document.getElementsByTagName("div")["load"].innerHTML="";
		nowloading_num=loadlist_an+1;
		newroomdelay=1000;
		stop_showing=true;
		paintNewroomBg();


}

var bgeffect="";
function paintNewroomBg(){
	paintBg();		//這邊不能call gostage 因為gostage call loaddata , loaddata call回來paintnewroombg

			
}


var gamestart=false;
var fadingbg=false;
var bgchangehidetime=100;
//var bgchangedelaytime=200;//被imagesLoaded取代
var bgchangeshowtime=360;
var nowbgsrc="";
function paintBg(){

	//if(storyhide) storystate();
	$("#story").html("");//換背景前先把字幕清空 體驗比較好
	if(gamestart==false){//for the first stage chagne , game start, load wavs
		//This is to limit the max sound of a preloaded game
		if( loadnums>0){
			//alert("聲音素材太多了, 不預先下載聲音!");
		}else{
					loadWav();
		}
	}
	gamestart=true;//for preventing use from clicking at game starting
	displayer[0]=layer[0];//分流用
	
	if(oldgame){
				displayer[0]="../db/pic/room/"+layer[0].substring(layer[0].indexOf("room/")+5, layer[0].length);
	}

					

	if(nowbgsrc!=layer[0]){//避免重複換背景閃爍

		$("#char").fadeOut();
		var bgimg=$("#bgimg");
		fadingbg=true;
		
/*		
		bgimg.fadeOut(bgchangehidetime,function(){
			bgimg.attr("src",displayer[0]).imagesLoaded(function(){
				
				bgimg.fadeIn(bgchangeshowtime,function(){					
					nowbgsrc=layer[0];
					$("#char").fadeIn(function(){fadingbg=false;});

				})
			})
		});
*/ //改由下面不等loading 因為loading太慢的網路玩起來像卡住
		bgimg.fadeOut(bgchangehidetime,function(){
			bgimg.attr("src",displayer[0]).fadeIn(bgchangeshowtime,function(){					
					nowbgsrc=layer[0];
					$("#char").fadeIn(function(){fadingbg=false;});
				})
		});

	}
	init();
	tellStory();

}


function Bgeffect(){
//	return;//取消非css特效 2015/10/29
	if(bgeffect==""){
		$("#bgimg").fadeTo(360,1);
	}else
	if(bgeffect=="透明"){
		$("#bgimg").css("background-color","#000000").fadeTo(360,0.6);			
	}else{
		
	}
}

var loadlist="";
var charloadlist="";
var bgloadlist="";
function loadMedia(){	
	//沒用了 直接load
	document.getElementsByTagName("div")["load"].innerHTML=loadlist;
}


function loadWav(){	
	//alert("test");
	document.getElementsByTagName("div")["load2"].innerHTML=wavloadlist;
}



/*
function loadEffect(src){ //接受人物出現 新房間出現 物品出現等播放

	document.all.music.innerHTML+="<embed src='"+src+"' hidden=true autostart=true loop=false>";
	alert(document.all.music.innerHTML);
}
*/

var audio;
var now_volume=0.5;
var fadein_time=12000;
lastmusic="";
function loadMusic(){	
//	if(uid=="lazi") alert(music[1]+":"+lastmusic);

            music[1] = music[1].replace("http://","https://");
			if( music[1]!=lastmusic && music[1]!="" && music[1]!=null){


				if(lastmusic!=""){
					
				}
				var musicfilename=music[1].substr(18,8);

				if( music[1].substr(26,4).toUpperCase()==".MID" && music[1].indexOf("../")!=-1){
					document.all.music.innerHTML="<audio style=\"width:100%\" id='musicplayer'  controls loop><source src=\"../db/sound/midtomp3/"+musicfilename+".mp3\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";			
					audio=$("#musicplayer");
				
		audio.animate({volume: 0}, 0);
		
        audio[0].addEventListener('canplay', function(){
			
			audio.animate({volume: now_volume}, fadein_time);
			
			audio[0].play();
			
        }, false)

		 					
					
				}else{
					document.all.music.innerHTML="<audio style=\"width:100%\" id='musicplayer' autoplay controls loop><source src=\""+music[1]+"\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";	
					//alert("2");
				}
				lastmusic=music[1];
			}
}

function loadMusicbyName(mname){	
				var musicfilename="";
				for(var i=0;i<sound.length;i++){

					if(mname==sound[i][0]){
						musicfilename=sound[i][1];
						//alert(musicfilename);
					}
				}

            musicfilename = musicfilename.replace("http://","https://");
			if(musicfilename.indexOf("../db/sound/")!=-1){

				var rawmusicfilename=musicfilename.substr(18,8);
				
				if( musicfilename.substr(26,4).toUpperCase()==".MID"){
					document.all.music.innerHTML="<audio style=\"width:100%\" id='musicplayer' autoplay controls loop><source src=\"../db/sound/midtomp3/"+rawmusicfilename+".mp3\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";
				}else{
					document.all.music.innerHTML="<audio style=\"width:100%\" id='musicplayer' autoplay controls loop><source src=\""+rawmusicfilename+"\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";	
				}
				
			}else{
				document.all.music.innerHTML="<audio style=\"width:100%\" id='musicplayer' autoplay controls loop><source src=\""+musicfilename+"\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";	
			}

			lastmusic=music[1];
}


function loadRoomeffect(){
	if(roomsound[0]!="" && roomsound[0]!=null ){
		
		var nowplay="<embed src="+roomsound[1]+" hidden=true autostart=true loop=false>";
		document.all.dummyspan.innerHTML=nowplay;
	}
}

function loadEffect(src){
	src = src.replace("http://","https://");
	if(src!="" && src!=null){


		document.all.dummyspan2.innerHTML="<audio style=\"width:100%\" id='musicplayer' autoplay ><source src=\""+src+"\" type=\"audio/mpeg\">你的瀏覽器不支援html5音樂撥放</audio>";	

/*
		var nowplay="<embed src="+src+" hidden=true autostart=true loop=false>";
		document.all.dummyspan2.innerHTML=nowplay;
*/
	}
}


window.nodeRequire = require;
var namer = require('color-namer')
var $ = global.jQuery = require('./jquery-2.1.4.min');

e = nodeRequire("electron");
fs = nodeRequire("fs");
const Dialogs = nodeRequire("dialogs");
const dialogs = Dialogs()

let child_process = require('child_process')


target = "dummy"

tagtotal = {};

resetcol = false;

let ctx = {}
let canvas = {}

clicked_lm=0;
mpos={x:0,y:0}

$("body").mousemove(function(e) {
	    mpos.x = e.pageX
	   	mpos.y = e.pageY

        mpos_rel = {x:mpos.x-$('.subimgholder').offset().left,y:mpos.y-$('.subimgholder').offset().top}
	})

document.body.addEventListener('mousedown', function(){
		clicked_lm=1;
	}, true); 

document.body.addEventListener('mouseup', function(){
		clicked_lm=3;
	}, true); 

sortby = 1;

dates = {};

var currentfiles = [];
var current_index = 0;
var cur_zoom = 1;
cur_pos = {x:parseFloat($('.subimgholder').css("left")),y:parseFloat($('.subimgholder').css("top"))}

if (currentfiles[current_index])
$('.centimg').attr("src",currentfiles[current_index].loc)

window.setTimeout(function(){
	if (currentfiles[current_index] && currentfiles[current_index].tags)
		$('.curtags').val(currentfiles[current_index].tags)
	else
		$('.curtags').val('');
},200)

drag = {start:{x:0,y:0},mode:0,pos_start:{x:0,y:0}}

let favd = {}

let mpos_rel = {x:0,y:0}

var main=function(){	
	//zooming
	$(window).bind('mousewheel', function(event) {
        //get previous position using jquery
        prevPos = $('.subimgholder').offset();
        let prev_zoom = cur_zoom;
        let prev_rel = {x:mpos_rel.x,y:mpos_rel.y}
        let image_size = {x:$('.centimg').width(),y:$('.centimg').height()}
        let delta = 0

		if (event.originalEvent.wheelDelta >= 0) {
			cur_zoom = cur_zoom*.75;
		}
		else {
			cur_zoom = cur_zoom*1.33333333333
		}

		vph = $(window).height();
	
        //move the image so that the mouse position would be at 0,0 before zoom
        cur_pos = {x:parseFloat($('.subimgholder').css("left")),y:parseFloat($('.subimgholder').css("top"))}
        zoomFraction = cur_zoom/prev_zoom
        $('.subimgholder').css({left:(cur_pos.x-(mpos_rel.x*zoomFraction))+mpos_rel.x, top:(cur_pos.y-(mpos_rel.y*zoomFraction))+mpos_rel.y})
        $('.centimg').css({height:((vph*cur_zoom)-96)+"px"})
	});

	e.ipcRenderer.on("load", function(event,arg){
        //
        load_filename(arg)
	})

    $('.openoutside').click(function(){
        e.ipcRenderer.send("openoutside",mainimage)
    })

	loop();
}

hoverTimeline = false

function loop(){
	//dragging
	if (clicked_lm==1)
	{
		if (!hoverTimeline){
			cur_pos = {x:parseFloat($('.subimgholder').css("left")),y:parseFloat($('.subimgholder').css("top"))}
			drag.mode=1;
	
			drag.start.x=mpos.x;
			drag.start.y=mpos.y;
	
			drag.pos_start.x=cur_pos.x;
			drag.pos_start.y=cur_pos.y;
		}
		clicked_lm=2;
	}

	if (clicked_lm==2)
	{
		if (drag.mode==1 && !hoverTimeline)
		{

			new_pos_x = (mpos.x-drag.start.x)/(Math.pow(cur_zoom,.2))+drag.pos_start.x;
			new_pos_y = (mpos.y-drag.start.y)/(Math.pow(cur_zoom,.2))+drag.pos_start.y;

			$('.subimgholder').css({left:new_pos_x+"px",top:new_pos_y+"px"})
		}
	}
	
	if (clicked_lm==3)
	{
		drag_mode=0;
	}

	requestAnimationFrame(loop);
}


function detectmob() { 
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}

window.onresize = function(event) {
resizeDiv();
}


function resizeDiv() {
	vpw = $(window).width();
	vph = $(window).height();

	m=detectmob()

	$('.gamecontenthere').css({height:(vph-96)+"px"})
	$('.centimg').css({height:(vph-96)+"px"})
    triggerResize()
}

function triggerResize(){
    setTimeout(function(){
        $('.centimg').css({height:((vph*cur_zoom)-96)+"px"})

        ww = $('.centimg').width()/2
        hh = $('.centimg').height()/2
    
        $('.subimgholder').css({left:(vpw/2)-ww+"px",top:(vph/2)-hh+"px"})
    },10)
}


function load_filename(filename)
{
	cur_zoom = 1

	vph = $(window).height();
    vpw = $(window).width();

	$('.centimg').attr("src",filename)

    $('.centimg').css({height:((vph*cur_zoom)-96)+"px"})
    setTimeout(function(){
        ww = $('.centimg').width()/2
        hh = $('.centimg').height()/2
    
        $('.subimgholder').css({left:(vpw/2)-ww+"px",top:(vph/2)-hh+"px"})

        e.ipcRenderer.send("requestResize",{width:ww*2, height:hh*2})

        triggerResize()
    },100)
    
    mainimage = filename;
}


$(document).ready(main)
$(document).ready(resizeDiv)


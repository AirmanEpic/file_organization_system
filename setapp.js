window.nodeRequire = require;

var $ = global.jQuery = require('./jquery-2.1.4.min');

e = nodeRequire("electron");
const dialog = e.dialog
fs = nodeRequire("fs");

target = "dummy"
let favd = false

e.ipcRenderer.on("new_stardata", (event, arg) =>{
	favd = arg
	console.log("new favd")
	if (favd){
		$('.starredToFolder').removeClass('disabled')
	}else{
		console.log("no favd")
	}
})

fs.readFile('target.json', 'utf8', function (err,data) {
	if (!err) 
	{
		//open it and read it. 
		target = data;

		$('.filelocation').val(target)
	}
});

var currentfiles = [];
var current_index = 0;
var cur_zoom = 1;

var main=function(){
	$('.savebut').click(function(event) {
		fs.readFile("target.json",'utf8', function (err,data){
			if (!err)
			{
				newdata = $('.filelocation').val()
				fs.writeFile("target.json",newdata,function (err) 
				{
					if (err) throw err;
					window.alert("Save successful. This will require a restart of the software.")
				})
			}
		})
	});

	$('.starredToFolder').not('disabled').click(function(event) {
		if (!favd){
			console.log("Early return")
			return
		}

		e.ipcRenderer.send("requestSaveFav")
	})

	$('.checkbox').click(function(){
		if ($(this).hasClass("checked")){
			$(this).removeClass('checked')
		}else{
			$(this).addClass('checked')
		}

		let isChecked = $(this).hasClass("checked")
		if ($(this).hasClass('enableRapid')){
			e.ipcRenderer.send("rapidMode",isChecked)
		}
	})
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
}


$(document).ready(main)
$(document).ready(resizeDiv)
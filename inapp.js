window.nodeRequire = require;
var namer = require('color-namer')
var $ = global.jQuery = require('./jquery-2.1.4.min');

e = nodeRequire("electron");
fs = nodeRequire("fs");
const Dialogs = nodeRequire("dialogs");
const dialogs = Dialogs()

let child_process = require('child_process')

curColors = JSON.parse(fs.readFileSync("imgColors.json"))

target = "dummy"

tagtotal = {};

resetcol = false;


let latestViews;
get_latest_views()

var walk = function(dir) {
    var results = []
    var list = fs.readdirSync(dir)
    list.forEach(function(file) {
        file = dir + '/' + file
        var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walk(file))
        else results.push(file)
    })
    return results
}

let ctx = {}
let canvas = {}
canvas = document.getElementById('timeline');
if (canvas.getContext) {
	ctx = canvas.getContext('2d');
}

fs.readFile('alltags.json', 'utf8', function (err,data) {
	if (err) 
	{
		//no file exists
		fs.open("alltags.json","w",function(erro,file){
			if (erro) throw erro
		})
		fs.writeFile("alltags.json","{}",function (err) 
		{
			if (err) throw err;
		})
	}
	else
	{
		tagtotal = JSON.parse(data);

		process_tagtotal();
	}
	});

fs.readFile('target.json', 'utf8', function (err,data) {
	if (!err) 
	{
		//open it and read it. 
		target = data;

		if (target=="dummy" || target=="/")
		{
			//prompt for settings
			prompt_settings();
		}
	}
});

if (!fs.existsSync("savedSearches.json")){
	fs.writeFileSync("savedSearches.json","{}")
}

let savedSearches = JSON.parse(fs.readFileSync("savedSearches.json").toString())

clicked_lm=0;
mpos={x:0,y:0}

$("body").mousemove(function(e) {
	    mpos.x = e.pageX
	   	mpos.y = e.pageY
	})

document.body.addEventListener('mousedown', function(){
		clicked_lm=1;
	}, true); 

document.body.addEventListener('mouseup', function(){
		clicked_lm=3;
	}, true); 

sortby = 1;

fs.readFile('target.json', 'utf8', function (err,data) {
	if (err) 
	{
		fs.open("target.json","w",function(erro,file){
			if (erro) throw erro
			console.log("saved!");
		})
		fs.writeFile("target.json","dummy",function (err) 
			{
				if (err) throw err;
				console.log('Replaced!')
			})
	}
	else
	{
		//open it and read it. 
		target = data;

		files = fs.readdirSync(target);
		filelist = walk(target)
		console.log("filelist saved")

		files = walk(target)
		// console.log(files)

		for (var i=0; i<files.length; i++)
		{
			d = fs.statSync(files[i]).mtime;
			nd = new Date(d)
			ms = nd.getTime();
			dates[files[i]] = ms
		}

		for (var i=0; i<files.length; i++)
				{
					currentfiles.push({loc:files[i],tags:'',date:dates[files[i]]})
				}

		fs.readFile('tags.json', 'utf8', function (err,data) {
			if (err) 
			{
				//no file exists
				fs.open("tags.json","w",function(erro,file){
					if (erro) throw erro
					tagdata=[];
				})
				fs.writeFile("tags.json","{}",function (err) 
					{
						if (err) throw err;
						console.log('Replaced!')
					})
			}
			else
			{

				//open it and read it. 
				tagdata = JSON.parse(data);

				for (var i=0; i<files.length; i++)
				{
					if (tagdata[files[i]])
					{
						currentfiles[i].tags=tagdata[files[i]];
					}
				}
			}
		});
	}
});

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
let isHoveringButton = false;
let hoverButtonTimeout = 0;
let hoverButtonInterval = false;
let hoverButtonIntervalTime = 5;
let hoverModeTime = 0.5;
let skipCount = false;

let favd = {}

let mpos_rel = {x:0,y:0}

var main=function(){
	//attach navbar and footer hover events
	$('.countbox').css({"color":"black"})
	$('nav').hover(function() {
		$(this).children(".navunder").css({top:0})
	}, function() {
		if (!$('.searchstr').is(":focus") && !$(".pinLower").hasClass("checked"))
			$(this).children(".navunder").css({top:"-100%"})
	});

	$('footer').hover(function() {
		$(this).children(".footerunder").css({top:"0"})
	}, function() {
		if (!$('.curtags').is(":focus") && !$(".pinLower").hasClass("checked"))
			$(this).children(".footerunder").css({top:"100%"})
	});

	if (Object.keys(savedSearches).length > 0)
	{
		let currentSearchStrings = Object.keys(savedSearches)
		currentSearchStrings = currentSearchStrings.filter((item)=>{
			return item.length>2
		})
		
		//most popular
		currentSearchStrings.sort(function(a,b){
			return savedSearches[b].count - savedSearches[a].count
		})
		let mostPop = copy(currentSearchStrings[0])

		//most recent
		currentSearchStrings.sort(function(a,b){
			return savedSearches[b].latest - savedSearches[a].latest
		})
		let mostRec = copy(currentSearchStrings[0])

		//random
		currentSearchStrings.sort(function(a,b){
			return 1-(Math.random()*2)
		})

		let mostRandom = copy(currentSearchStrings[0])

		let buttonStrGen = (str,prompt)=>{
			return `<button class='searchStr' to='${str}'>${prompt}: ${str}</button>`
		}

		mainStr = buttonStrGen(mostPop, "Popular") + buttonStrGen(mostRec, "Recent") + buttonStrGen(mostRandom, "Random")

		$('.searcharea').html(mainStr)
		$('.searchStr').click(function(){
			let mySearch = $(this).attr("to")
			console.log("Last char was",mySearch[mySearch.length-1]," Which",(mySearch[mySearch.length-1] == " ") ? "is" : "is not"," a space")
			if (mySearch[mySearch.length-1] == " "){
				mySearch = mySearch.slice(0,-1)
			}
			skipCount = true
			$('.searchstr').val(mySearch)
			$('.searchstr').trigger("change")
		})
	}

	$('.chevron').on({
	    mouseenter: function() {
	       	isHoveringButton = true
	       	if (!rapidMode){
	       		return
	       	}
	       	console.log("Starting hover")
	       	left = $(this).hasClass("left")
	       	hoverButtonTimeout = setTimeout(function(left) {
	       		console.log("Starting interval")
	       		if (isHoveringButton){
	       			hoverButtonInterval = setInterval(function(left){
	       				console.log("has left: ",left)
	       				if (left){
	       					chevronDir(-1)
	       				}else{
	       					chevronDir(1)
	       				}
					load_id(current_index);
	       			}, hoverModeTime * 1000, left)
	       		}
	       	},hoverButtonIntervalTime*1000, left)

	    },
	    mouseleave: function() {
	    	isHoveringButton = false
	    	if (!rapidMode){
	       		return
	       	}
	    	clearTimeout(hoverButtonTimeout)
	    	hoverButtonTimeout = false
	    	if (hoverButtonInterval){
	    		clearInterval(hoverButtonInterval);
	    		hoverButtonInterval = false
	    	}
	    }
	})
	
	//zooming
	$(window).bind('mousewheel', function(event) {
		if (event.originalEvent.wheelDelta >= 0) {
			cur_zoom = cur_zoom*.75;
		}
		else {
			cur_zoom = cur_zoom*1.33333333333
		}

		vph = $(window).height();
		$('.centimg').css({height:((vph*cur_zoom)-96)+"px"})

	});

	$('.searchstr').change(function(){
		t = this
		sort_and_display_2(t)
	})

	$('.searchstr').on("input",function(){
		console.log("Setting JUAC")
		justUsedAutocomplete = true;
		//we'll  want to change the displayed tags to limit it to only the ones being searched.
		nss = $(this).val();
		sub_ss = nss.split(" ");
		//the last tag is the search thing.
		lastTag = sub_ss[sub_ss.length-1];
		charlist = lastTag.split("");
		keys = Object.keys(tagtotal)
		usefulKeys = copy(keys);
		charlist.forEach(function(char,ind){
			for (var i=0; i<usefulKeys.length; i++){
				if (char != usefulKeys[i][ind]){
					usefulKeys.splice(i,1)
					i--;
				}
			}
		})

		process_culledTagList(usefulKeys);
	})

	$('.searchstr').focusout(function(event) {
		//repopulate tags 1 second later
		setTimeout(process_tagtotal,100);
	});


	$('.curtags').on("input",function(){
		nss = $(this).val();
		sub_ss = nss.split(" ");
		//the last tag is the search thing.
		lastTag = sub_ss[sub_ss.length-1];
		charlist = lastTag.split("");
		keys = Object.keys(tagtotal)
		usefulKeys = copy(keys);
		charlist.forEach(function(char,ind){
			for (var i=0; i<usefulKeys.length; i++){
				if (char != usefulKeys[i][ind]){
					usefulKeys.splice(i,1)
					i--;
				}
			}
		})

		process_culledTagList(usefulKeys);
	})

	$('.curtags').focusout(function(event) {
		//repopulate tags 1 second later
		setTimeout(process_tagtotal,100);
	});

	$('.chevron').click(function(event) {
		save_tags();

		if ($(this).hasClass("left"))
		{
			chevronDir(-1)
		}
		else
		{
			chevronDir(1)
		}
		if (hoverButtonTimeout){
			clearTimeout(hoverButtonTimeout)
		}
		load_id(current_index);
	});

	$('.settingsbut').click(function(event){
		prompt_settings();
	})

	$('.checkbox').click(function(){
		if ($(this).hasClass("checked")){
			$(this).removeClass('checked')
		}else{
			$(this).addClass('checked')
		}

		if ($(this).hasClass('starImg')){
			thisLoc = currentfiles[current_index].loc
			favd[thisLoc] = $(this).hasClass('checked')
			e.ipcRenderer.send("update_stars",favd)
		}
	})

	$(canvas).mousemove(function(e) {
		mpos_rel.x = e.pageX - $(canvas).offset().left;
		mpos_rel.y = e.pageY - $(canvas).offset().top;
	})

	e.ipcRenderer.on("newRapidMode", function(event,arg){
		rapidMode = arg
	})

	e.ipcRenderer.on("open", function(event,arg){
		//see if the tags file exists for this
		//if it does, load the tags 
		//if not, create the tag in the tag file
		//then load the tags

		//when a file is loaded this way, the containing folder is 
		console.log("Received open command")
		id = -1
		filename = arg.split("\\")[arg.split("\\").length-1]
		console.log("Filename is: ",filename)
		folders = arg.split("\\")
		folders = folders.slice(folders.length-2,folders.length-1)
		folders = folders.join("/")
		console.log("Folders: ",folders)
		$('.searchstr').val("folder:"+folders.split(" ")[0]+" sortby:date")
		sort_and_display_2($('.searchstr')[0])


		for (var i=0; i<currentfiles.length; i++){
			//if the currentfiles[i].loc (which is a string) contains the substring filename, then we have a match
			if (currentfiles[i].loc.indexOf(filename) != -1){
				id = i;
				break;
			}
		}

		console.log("ID found: ",id," for ",arg," in ",currentfiles)

		//this is a known file. load it
		if (id != -1){
			current_index = id;
			load_id(id);
			//change the search settings so that the folder of the file is in the search
			//get the last 2 folders of the file
			return;
		}


	})

	loop();
}

let rapidMode = false

function chevronDir(direction){
	if (direction == -1){
		if (current_index!=0){
			current_index-=1;
			begin_anim(1,0,len=10)
		}else{
			begin_anim(1,0,len=10)
			current_index = currentfiles.length-1;
		}
	}
	if (direction == 1){
		if (current_index!=currentfiles.length-1)
		{
			current_index+=1;
			begin_anim(-1,0,len=10)
		}
		else
		{
			begin_anim(-1,0,len=10)
			current_index = 0;
		}
	}
}

function sort_by_date(a,b){
	return b.date-a.date
}

let is_hovering_timeline = false
let is_animating = false
let anim_frame = 0
let anim_done = 0
let anim_val = 0
let anim_start = 0
let anim_end = 0
let dir_move = 0

function loop(){
	//dragging
	hoverTimeline = $('#timeline')[0].matches(':hover')
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

		if (hoverTimeline){
			dirToMouse = (-point_direction({x:canvas.width/2, y:canvas.height/2}, mpos_rel)+720)%360
			idSelected = Math.round((dirToMouse/360) * (currentfiles.length-1))

			if (idSelected!=current_index){
				current_index = idSelected
				load_id(current_index);
			}
		}
	}
	
	if (clicked_lm==3)
	{
		drag_mode=0;
	}

	requestAnimationFrame(loop);

	if (!ctx){
		return
	}

	if (is_animating){
		anim_frame += 1
		if (anim_frame >= anim_done){
			is_animating = false
		}

		anim_val = lerp_d(anim_start,anim_end, anim_frame/(anim_done-1))
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineCap = 'round';
	//draw 
	ctx.beginPath();
	ctx.strokeStyle = "#34ebe5"
	ctx.lineWidth = 10
	ctx.arc(canvas.width/2,canvas.height/2, (canvas.width/2) - 20, 0, Math.PI*2)
	ctx.stroke()

	//draw bead
	let bead_pos = (current_index / (currentfiles.length)) * 360
	if (is_animating){
		bead_pos += (((anim_val)/(currentfiles.length)) * 360)
	}
	let bead_vec = lengthdir(canvas.width/2 - 20, bead_pos)

	ctx.beginPath();
	ctx.arc(bead_vec.x + canvas.width/2, bead_vec.y + canvas.height/2, 15, 0, Math.PI*2);
	ctx.fillStyle = "#ebbd34"
	ctx.fill();
}

function begin_anim(start, end, len=100){
	anim_start = start
	anim_end = end
	is_animating = true
	anim_frame = 0
	anim_done = len
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
}

function in_list(item,list){
	for (var i=0; i<list.length;i++)
	{
		if (list[i]==item)
		{
			return i+1;
		}
	}
	return false;
}

function write_latest_view(targ){
	let d = new Date().getTime()

	latestViews[targ] = d
	save_latest_views()
	get_latest_views()
}

function save_latest_views(){
	fs.writeFileSync("latest_view.json",JSON.stringify(latestViews))
}

function get_latest_views(){
	if (!fs.existsSync("latest_view.json")){
		fs.writeFileSync("latest_view.json","{}")
	}

	latestViews = JSON.parse(fs.readFileSync('latest_view.json').toString())
}

function save_tags(){
	//todo: add current_index as a parameter
	let tags = $('.curtags').val();
	let targ = currentfiles[current_index].loc

	currentfiles[current_index].tags=tags;
	
	write_latest_view(targ)
	
	if (tags.length==0)
	{
		//window.alert("Warning: tagdata was 0!")
	}
	else
	{
		add_tags_to_file({id:targ,new_data:tags})

		//special tags check. The one I want is special:all_files_in_folder$<tagname>

		splitTags = tags.split(" ");
		splitTags.forEach(function(tag){
			fp = tag.split("special:all_files_in_folder$")
			if (fp.length!=1){
				//also remove this tag from the list
				setAllInFolderPrompt(fp[1],targ);

			}
		})

		fs.readFile('alltags.json', 'utf8', function (err,data) {
			if (err) 
			{
				//no file exists
				fs.open("alltags.json","w",function(erro,file){
					if (erro) throw erro
				})
				fs.writeFile("alltags.json","{}",function (err) 
				{
					if (err) throw err;
				})
			}
			else
			{
				tagtotal = {}
				for (var i=0; i<files.length; i++)
				{
					if (tagdata[files[i]]){
						spltags = tagdata[files[i]].split(" ");
	
						for (var ii=0; ii<spltags.length; ii++)
						{
							if (tagtotal[spltags[ii]] && tagtotal[spltags[ii]].count)
							{
								tagtotal[spltags[ii]].count+=1;
								if (resetcol)
								{
									tagtotal[spltags[ii]].col=hslToRgb(Math.random(),.65,.5)
									console.log("resetting col")
								}
							}
							else
							{
								tagtotal[spltags[ii]]={count:1,col:hslToRgb(Math.random(),.65,.5)}
							}
						}
					}
				}

				newstr = JSON.stringify(tagtotal);

				fs.writeFile("alltags.json",newstr ,function (err) 
				{
					if (err) throw err;
				})
			}
		});
	}

	
}

function setAllInFolderPrompt(tag,folder){
	globtag = tag;
	globfolder = folder;
	dialogs.confirm("WARNING \n You are about to add the tag \n"+tag+"\n EVERY file in directory \n"+folder+"\n Double check before starting",function(ok){
		if (ok)
			setAllInFolder(globtag,globfolder)
	})
}

function setAllInFolder(tag,folder){
	tagdata[folder] = tagdata[folder].split("special:all_files_in_folder$")[0]

	subfolders = folder.split("/")
	subfolders.splice(subfolders.length-1,1)
	totalFolder = ""
	subfolders.forEach(function(subfolder){
		totalFolder += subfolder+"/";
	})

	console.log("Folders now: "+totalFolder);

	i=0;
	b=0
	keys = Object.keys(tagdata)
	keys.forEach(function(file){
		fp = file.split(totalFolder)
		b +=1
		if (fp.length!=1){
			if (tagdata[file].split(tag).length==1){
				//i+=1
				tagdata[file] += " "+tag//+" autoadded"
			}
			else{
				console.log("excluded a file which was already marked")
			}
		}
	})

	files.forEach(function(file){
		fp = file.split(totalFolder)
		if (!tagdata[file])
		{
			if (fp.length!=1){
				tagdata[file] = tag
			}
		}
	})

	//console.log("Would have changed "+i+"/"+b)
	tdStr = JSON.stringify(tagdata)
	fs.writeFileSync("tags.json",tdStr)
	//location.reload();
}

function load_id(id)
{
	cur_zoom = 1

	vph = $(window).height();
	$('.centimg').css({height:((vph*cur_zoom)-96)+"px"})

	$('.subimgholder').css({left:"50%",top:"50%"})

	$('.centimg').attr("src",currentfiles[id].loc)

	if (currentfiles[id].tags)
		{
			console.log("data for "+id+" found")
			$('.curtags').val(currentfiles[id].tags)
		}
		else
		{
			console.log("data for "+id+" not found")
			$('.curtags').val('');
		}
	$('.filelocation').unbind('click')
	$('.filelocation').text(currentfiles[id].loc)
	$('.filelocation').click(function(){
		currentLoc = $(this).text()
		child_process.exec(`start "" "${currentLoc}"`)
		//TODO: change this to open the image in a new window. 
	})
	w = $('.filelocation').width();
	$('.balancer').css({width:w+"px",height:"1px"})

	let favChecked = !!favd[currentfiles[current_index].loc]
	$('.starImg').removeClass('checked')
	if (favChecked){
		$('.starImg').addClass('checked')
	}
}

function add_tags_to_file(data){
	tagdata[data.id]=data.new_data;
	fs.writeFileSync("tags.json",JSON.stringify(tagdata))
	tagdata = JSON.parse(fs.readFileSync("tags.json"))
}

function prompt_settings(){

	e.ipcRenderer.send("requestSettings","")
	setTimeout(function(){
		e.ipcRenderer.send("update_stars",favd)
	},1000)
}

function process_tagtotal(){
	justUsedAutocomplete = false;
	mostcount = 0; 
	keys = Object.keys(tagtotal)
	for (var i=0; i<keys.length; i++)
	{
		thiscount = tagtotal[keys[i]].count;

		if (thiscount>mostcount)
		{
			mostcount = thiscount;
		}
	}

	keys.sort(sort_tagtotal_keys);

	str =""
	for (var i=0; i<keys.length; i++)
	{
		str += generate_tag(keys[i])
	}

	$('.tagarea').html(str)

	$('.tag-ic').click(function(event) {
		txt=$(this).children('.tag-right').children("p").text()

		curval = $('.searchstr').val()
		if (curval.length==0)
		{
			$('.searchstr').val(txt)
		}
		else
		{
			//trim the word that's being written (the last one) first
			if (justUsedAutocomplete){
				newcur = curval.split(" ");
				curval = ""
				newcur.forEach(function(item){
					curval += item+" "
				})

				$('.searchstr').val(curval+txt)
				justUsedAutocomplete = false
			}
			else
			{
				$('.searchstr').val(curval+" "+txt)
			}
		}

		$('.searchstr').trigger("change");
	});
}

function process_culledTagList(tagsList){
	mostcount = 0; 
	keys = tagsList;
	for (var i=0; i<keys.length; i++)
	{
		thiscount = tagtotal[keys[i]].count;

		if (thiscount>mostcount)
		{
			mostcount = thiscount;
		}
	}

	keys.sort(sort_tagtotal_keys);

	str =""
	for (var i=0; i<keys.length; i++)
	{
		str += generate_tag(keys[i])
	}

	$('.tagarea').html(str)

	$('.tag-ic').click(function(event) {
		txt=$(this).children('.tag-right').children("p").text()

		curval = $('.searchstr').val()
		if (curval.length==0)
		{
			$('.searchstr').val(txt)
		}
		else
		{
			//trim the word that's being written (the last one) first
			if (justUsedAutocomplete){
				newcur = curval.split(" ");
				curval = ""
				newcur.forEach(function(item,ind){
					if (ind!=newcur.length-1)
					curval += item+" "
				})

				$('.searchstr').val(curval+txt)
				justUsedAutocomplete = false
				console.log("Setting JUAC = false")
			}
			else
			{
				$('.searchstr').val(curval+" "+txt)

			}
		}

		$('.searchstr').trigger("change");
	});
}

function sort_culledTagList_keys(a,b)
{
	return a-b
}

function sort_tagtotal_keys(a,b)
{
	return tagtotal[a].count-tagtotal[b].count
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {r:Math.round(r * 255), g:Math.round(g * 255), b:Math.round(b * 255)};
}

function copy(obj){
	return JSON.parse(JSON.stringify(obj));
}

function generate_tag(keyName){
	thiscount = tagtotal[keyName].count;
		col = tagtotal[keyName].col;
		perc = thiscount/mostcount;

		col = "rgb("+Math.floor(col.r)+","+Math.floor(col.g)+","+Math.floor(col.b)+")"

		col_l = "rgb("+Math.floor(255*(1-perc))+","+Math.floor(255*(1-perc))+","+Math.floor(255*(1-perc))+")"

		tcSize = 1
		if (thiscount>9){
			tcSize = 0.8
		}
		if (thiscount>99){
			tcSize = 0.75
		}
		if (thiscount>999){
			tcSize = 0.5
		}

		col_t = "white"
		if (perc<0.25){
			col_t = "black"
		}

		return '<div class="tag-ic" hiddenstats="perc: '+perc+' count: '+thiscount+'"><p class="tag-left" style="background-color:'+col_l+'; font-size:'+tcSize+'em; color:'+col_t+'">'+thiscount+'</p><div class="tag-right" style="background-color:'+col+'"><p>'+keyName+'</p></div></div>'
}

function sort_and_display(){
//nss: New Search String
	nss = $(this).val();

	oldfile = currentfiles[current_index];
	currentfiles = [];
	current_index=0;
	//currentfiles.push(oldfile);

	//break the string into parts
	sub_ss = nss.split(" ");

	//find any color tags.
	colorSearch = []
	folderName = ""
	sub_ss.forEach(function(string,ind){
		type = string.charAt(0)
		superType = "OR"
		if (type=="+"){
			superType = "AND"
		}
		if (type=="-"){
			superType = "WITHOUT"
		}

		if (string.split("folder:").length>1){
				folderName = string.split("folder:")[1].toLowerCase()
				folderType = superType
				console.log("Folder name search: ",folderName, superType)
			}

		if (string.split("color:").length>1){
			//this is a color search string.
			var newObj = {}
			newObj.searchType=superType

			radius = parseInt(string.split("$")[1])
			name = string.split(":")[1].split("$")[0]
			namesep = namer("rgb(0,0,0)")
			names = namesep.roygbiv.concat(namesep.basic,namesep.html,namesep.x11,namesep.pantone,namesep.ntc)
			names.forEach(function(nameI,ind){
				if (newObj.hex){
					return
				}

				if (nameI.name==name){
					newObj.hex = nameI.hex
				}
			})

			newObj.rad = radius
			if (newObj.hex){
				colorSearch.push(newObj)
			}else{
				console.warn("No color found for ",name)
			}
		}
	})

	//now go through all files and find any that match the search critera
	for (var i=0; i<files.length; i++)
	{
		file_tags = tagdata[files[i]]
		if ((typeof file_tags !="undefined") && file_tags.length!=0)
		{
			//console.log("testing for I = "+i)
			file_tags_breakdown = file_tags.split(" ")
			file_tags_breakdown.push("special:tagged")
		}
		else
		{
			file_tags_breakdown = ["special:notags"];
		}

		file_tags_breakdown.push("special:any")

		if (favd[files[i]]){
			file_tags_breakdown.push("special:starred")
		}

		pushthis = false;

		if (nss.length != 0)
		{
			for (var ii=0; ii<sub_ss.length; ii++)
			{
				specchar = sub_ss[ii].charAt(0)
				
				if (specchar!="-")
				{
					//if the current tag is in the list of tags for this pic
					if (in_list(sub_ss[ii],file_tags_breakdown))
					{
						pushthis = true;
					}

					if (specchar=="+")
					{
						if (!in_list(sub_ss[ii].substring(1,sub_ss[ii].length),file_tags_breakdown))
						pushthis=false;
					}						
				}
				else
				{
					if (in_list(sub_ss[ii].substring(1,sub_ss[ii].length),file_tags_breakdown))
					{
						pushthis = false
					}
				}
			}
		}
		else
		{
			pushthis = true;
		}

		//color:white$1 +color:red$20
		colorSearch.forEach(function(cs,ind){
			fileToCheck = files[i]
			collist = curColors[fileToCheck]
			if (collist && collist.length>0){
				myColorDistances = namer(cs.hex,{pick:["pantone","x11"]})
				var namesCat = myColorDistances.pantone.concat(myColorDistances.x11)
				var pass = false
				namesCat.forEach(function(name,indN){
					if (ind == 1 && name.distance<cs.rad){
						// console.log("Name:",name.name,"Dist: ",name.distance," indexOf: ",collist.indexOf(name.name), "collist: ",collist)
					}
					if (name.distance<cs.rad && collist.indexOf(name.name)!=-1){
						pass = true
					}
				})

				if (pass){
					// console.log("pass for "+cs.hex)
					if (pushthis){
						if (cs.searchType=="WITHOUT"){
							pushthis = false
						}
					}else{
						if (cs.searchType=="OR"){
							pushthis = true
						}
					}
				}else{
					if (cs.searchType=="AND" && pushthis){
						pushthis = false
					}
				}
			}
		})

		if (folderName){
			console.log("Split: ",folderName,files[i].toLowerCase().split(folderName))
			if (files[i].toLowerCase().split(folderName).length>1){
				if (folderType=="WITHOUT"){
					pushthis = false
				}
				if (folderType=="OR"){
					pushthis = true
				}

			}else{
				if (folderType=="AND"){
					pushthis = false
				}
			}
		}

		if (pushthis)
		currentfiles.push({loc:files[i],date:dates[files[i]],tags:tagdata[files[i]]})
	}

	sub_ss.forEach(function(item){
		if (item=="sortby:view_old"){
			sortby = 4
		}

		if (item=="sortby:view_new"){
			sortby = 3
		}

		if (item=="sortby:random"){
			sortby = 2
		}

		if (item == "sortby:date"){
			sortby = 1
		}

		if (item == "size:large"){
			//go through the items, open each, and find its size.
		}
	})

	

	//and order them by the specified thing.
	if (sortby==1)
	{
		//sort by date
		currentfiles.sort(sort_by_date)
		console.log("sorted!")
	}

	if (sortby == 2){
		let shuffled = currentfiles
		  .map((a) => ({sort: Math.random(), value: a}))
		  .sort((a, b) => a.sort - b.sort)
		  .map((a) => a.value)
		currentfiles = copy(shuffled)
	}
	get_latest_views()
	if (sortby == 3 || sortby == 4){
		//sort by view new
		let shuffled = currentfiles
		  .map((a) => ({sort: Math.random(), value: a}))
		  .sort((a, b) => {
		  	a_sort = a.sort
		  	b_sort = b.sort
			a_last_viewed = latestViews[a.value.loc]
			b_last_viewed = latestViews[b.value.loc]
		  	if (a_last_viewed){
		  		a_sort = a_last_viewed
		  	}
		  	if (b_last_viewed){
		  		b_sort = b_last_viewed
		  	}
		  	if (sortby == 3){
		  		return a_sort - b_sort
		  	}
		  	else{
		  		return b_sort - a_sort
		  	}
		  })
		  .map((a) => a.value)
		currentfiles = copy(shuffled)
		currentfiles.forEach(function(item,ind){
			if (latestViews[item.loc]){
				// console.log("Found one for ind ",ind)
			}
		})
	}


	if (sortby == 0)
	{
		console.log("didn't sort!")
	}
	if (currentfiles.length!=0){
		$('.countbox').text(currentfiles.length)
		$('.countbox').css({"color":"white"})
	}else{
		$('.countbox').text("Error: no images found for that search.")
		$('.countbox').css({"color":"red"})
	}
	load_id(current_index);
	if (hoverButtonTimeout){
		clearTimeout(hoverButtonTimeout)
	}
}

function sort_and_display_2(tt){
	let nss = $(tt).val()

	if (!skipCount && nss.length > 1){
		sub_ss = nss.split(" ");
		subSSSort = copy(sub_ss)
		subSSSort.sort()
		subSSSort.reverse()
		alphaSS = ""

		subSSSort.forEach(function(item){
			alphaSS += item + " "
		})

		alphaSS = alphaSS.slice(0,-1)

		if (savedSearches[alphaSS]){
			savedSearches[alphaSS].latest = Date.now()
			savedSearches[alphaSS].count += 1
		}else{
			savedSearches[alphaSS] = {latest: Date.now(), count:1}
		}

		fs.writeFileSync("savedSearches.json",JSON.stringify(savedSearches))
	}else{
		skipCount = false
	}

	oldfile = currentfiles[current_index];
	current_index=0;

	let searchStrings = nss.split(' ')
	let sortItems = searchStrings.filter(word => word.includes("sortby:"))
	let limitItems = searchStrings.filter(word => word.includes("limit:"))
	let andItems = searchStrings.filter(word => word[0]=="+")
	let withoutItems = searchStrings.filter(word => word[0]=="-")
	let orItems = searchStrings.filter(word => !(word[0]=="+" || word[0]=="-" || word.includes("sortby:") || word.includes("limit:"))) 

	//start by generating the full list from the most permissive options.
	let fullList = files.filter(file =>{
		//map checks every "orItem" against parse_word
		//every will only be true if every item is missing (thanks to the ! in !item).
		//since we're inverting that, we get every one where a single one passes parse_word
		return !orItems.map(item => parse_word(item, file)).every(item=>!item)
	})

	//remove failures to match andItems
	fullList = fullList.filter(file =>{
		//example: +wings +hammer
		//file does not contain wings but contains hammer
		//false, true
		// every is false
		// return false

		//also note that if andItems is empty, every will be true 
		return andItems.map(item => parse_word(item, file)).every(item=>item)
	})

	//remove withoutItems
	fullList = fullList.filter(file =>{
		//example: -wings, -hammer
		//file does not contain wings but contains hammer, so we should return false
		//false, true
		//becomes true, false
		//every is false
		//return false

		// example 2: -wings, -foo
		// file does not contain wings nor foo, so we should return true
		// flase, false
		// becomes true, true
		// every is true
		// return true
		return withoutItems.map(item => parse_word(item, file)).every(item=>!item)
	})

	//fulllist is now an unsorted list of all files that pass.
	//sort them now.

	let sortMethods = sort_methods_dict()

	//first sort method is the only valid one for now. The others are discarded.
	let sortMethod = false
	let sortName = false
	if (sortItems.length > 0) {
		sortName = sortItems[0].split(":")[1]
	}

	currentfiles = fullList.map(file => {
		return {loc:file,date:dates[file],tags:tagdata[file]}
	})

	if (sortName){
		sortMethod = sortMethods[sortName]
		if (sortMethod){
			currentfiles.sort((a,b) =>{
				return sortMethod(b) - sortMethod(a)
			})
		}
	}

	if (limitItems.length == 1){
		limit = parseInt(limitItems[0].split(":")[1])
		currentfiles.length = limit
	}


	if (currentfiles.length!=0){
		$('.countbox').text(currentfiles.length)
		$('.countbox').css({"color":"white"})
	}else{
		$('.countbox').text("Error: no images found for that search.")
		$('.countbox').css({"color":"red"})
	}

	if (limitItems.length > 1){
		$('.countbox').text("Error: Only 1 limit allowed")
		$('.countbox').css({"color":"red"})
	}



	load_id(current_index);

	if (hoverButtonTimeout){
		clearTimeout(hoverButtonTimeout)
	}
}

function parse_word(word, loc){
	//returns true if the selected loc passes the parameter.
	// for ordinary tags this means that the loc's tags contain the word provided.
	word = word.replace("+","")
	word = word.replace("-","")

	//start by breaking the tags into words if possible.
	let file_tags = tagdata[loc]
	let file_tags_breakdown = []
	if ((typeof file_tags !="undefined") && file_tags.length!=0)
	{
		file_tags_breakdown = file_tags.split(" ")
	}

	if (word == "special:notags" && (file_tags_breakdown ==[] || file_tags_breakdown.length == 0)){
		return true
	}

	if (word == "special:tagged" && (file_tags_breakdown !=[] && file_tags_breakdown.length != 0)){
		return true
	}

	if (word == "special:any"){
		return true
	}

	if (word == "special:starred" && favd[loc]){
		return true
	}

	if (word.includes("folder:")){
		let folderToFind = word.split("folder:")[1]
		return (loc.toLowerCase().split(folderToFind).length>1)
	}

	//color match
	let colorSearch = false
	if (word.includes("color:")){
		//this is a color search string.
		var newObj = {}

		radius = parseInt(word.split("$")[1])
		name = word.split(":")[1].split("$")[0]
		namesep = namer("rgb(0,0,0)")
		// create a list of all colors.
		names = namesep.roygbiv.concat(namesep.basic,namesep.html,namesep.x11,namesep.pantone,namesep.ntc)
		names.forEach(function(nameI,ind){
			if (newObj.hex){
				return
			}
			//find a matching hex color to the name provided
			if (nameI.name==name){
				newObj.hex = nameI.hex
			}
		})

		newObj.rad = radius
		if (newObj.hex){
			colorSearch = newObj
		}else{
			console.warn("No color found for ",name)
		}
	}

	if (colorSearch){
		collist = curColors[loc]
		if (collist && collist.length>0){
			//create a list of colors and their distances from colorSearch.hex
			// this is the most expensive operation
			splitListOfColors = namer(colorSearch.hex, {pick:["pantone","x11"]})
			//combine list of colors under pantone with those under x11
			var myColorDistances = splitListOfColors.pantone.concat(splitListOfColors.x11)
			var pass = false
			myColorDistances.forEach(function(name,indN){
				//each color has a radius from the original (colorSearch.hex)
				//check if that color from myColorDistances is in the search radius
				//if so, check that its name is also one in the image's colors list.
				if (name.distance<colorSearch.rad && collist.indexOf(name.name)!=-1){
					pass = true
				}
			})

			return pass
		}
	}

	//standard word
	contains_standard = false
	file_tags_breakdown.forEach(function(item){
		if (word == item){
			contains_standard = true
		}
	})

	return contains_standard
}

function sort_methods_dict(){
	return {
		//score each item
		view_old: function(item){
			let last_viewed = latestViews[item.loc]
			if (last_viewed){
				return last_viewed
			}

			return Math.random()*100
		},
		view_new: function(item){
			let last_viewed = latestViews[item.loc]
			if (last_viewed){
				return -last_viewed
			}

			return Math.random()*100
		},
		random: function(item){
			return Math.random()*100
		},
		date: function(item){
			return item.date
		},
		date_old: function(item){
			return -item.date
		},
		// size: function(item){
			// return item.date
		// },
	}
}

$(document).ready(main)
$(document).ready(resizeDiv)


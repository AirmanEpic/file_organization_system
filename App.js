const {app, BrowserWindow, ipcMain, dialog} = require('electron')

var fs = require('fs');
const getColors = require('get-image-colors')
var namer = require('color-namer')
var files = fs.readdirSync('/');
target = "dummy"
var curColors = {}

resolve = require('path').resolve

if (fs.existsSync("imgColors.json")){
	readColors()
}else{
	console.log("Created blank imgColors.")
	console.log("Parsing the imgcolors will take a long time this run!")
	writeColors()
}

rejectList = [
	"../charecters/fatasy/demia_by_drakarra-dcljlr1.png",
	"../charecters/Face only/E Clarke/WAc5lSA.jpg",
	"../charecters/fatasy/20200717_111532.jpg",
	"../charecters/fatasy/esmiramer_s_by_ninami-dcamv98.png",
	"../charecters/fatasy/kivaa__lightforged_draenei__2_by_faebelina-dbx7wwp.png",
	"../charecters/fatasy/kivaa__lightforged_draenei__by_faebelina-dbw44en.png",
	"../charecters/fatasy/mermay_by_ryumo-dcbssnr.png"
]

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

		global.filedata = filelist;
	}
});

async function generateColors(fl){
	readColors()
	console.log("Starting read loop.",fl)
	await asyncForEach(fl,async (item,ind) =>{
		// if (ind>1000){
		// 	return
		// }
		if (curColors[item]){
			//ignore this, as it's already been parsed
			// console.log("this has been parsed!")
		}
		else{
			//this needs to be parsed.
			console.log("Parsing ",item)
			if (isImage(item))

				curColors[item] = await parseColors(item).catch(err =>{
					return []
				})
			else{
				curColors[item] = []
			}
			console.log("CurColors[item]: ",curColors[item])
			// console.log("Parsed!")
		}

		if (ind%100 == 0){
			console.log("---------------------------------------------------------------------- COLORS WRITTEN --------------------------------------------------------")
			writeColors()
		}
	})
	console.log("Finished reading colors!")
	writeColors()
}

function writeColors(){
	fs.writeFileSync("imgColors.json",JSON.stringify(curColors,null,2))
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function isImage(fn) {
	suffix = fn.split('.')[3]
	// console.log("suffix: ",suffix)
	if (rejectList.indexOf(fn)!=-1){
		return false
	}

	if (suffix == "jpg" || suffix == "png" || suffix == "jpeg"){
		// console.log("suffix :",suffix,"is true!")
		return true
	}



	return false
}

function readColors(){
	curColors = JSON.parse(fs.readFileSync('imgColors.json').toString())
}

var files = fs.readdirSync(target);

var filelist = []

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

filelist = walk(target)

//locate old tags.json
var tagdata = {}

fs.readFile('tags.json', 'utf8', function (err,data) {
	if (err) 
	{
		//no file exists
		global.tagdata = [];
		fs.open("tags.json","w",function(erro,file){
			if (erro) throw erro
			console.log("saved!");
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
		//console.log("tagdata: "+data)
		//win.webContents.send("new_tagdata",tagdata)
	}
});

global.filedata = filelist;

setTimeout(function(){generateColors(filelist)},500)

require('electron-debug')();

function createWindow(){
	win = new BrowserWindow({width: 800, height: 600, webPreferences: {devTools: true, nodeIntegration: true, contextIsolation: false}})

	win.setMenu(null)

	win.loadFile('index.html')

	win.maximize();

	
}

function parseColors(file){
	return new Promise((resolve,error) =>{
		var cols = []
		mainTO = setTimeout(function(){
			resolve([])
		},5000)
		getColors(file).then(colors => {
			// `colors` is an array of color objects
			hexcols = colors.map(color =>color.hex())
			namesFinal = []
			hexcols.forEach(function(col,ind){
				// console.log(col)
				namesep = namer(col,{pick:["pantone","x11"]})
				var names = namesep.pantone.concat(namesep.x11)
				// console.log("Names: ",names)
				if (names && names.length > 0){
			  	names.forEach(function(name,indN){
			  		if (name.distance<10 && namesFinal.indexOf(name.name.toLowerCase())==-1){
			  			namesFinal.push(name.name.toLowerCase())
			  		}
			  	})
				}
			})
			console.log("Parsed ",file)
			  
			resolve(namesFinal)
			clearTimeout(mainTO)
		  
		})
	})
}

ipcMain.on("updatetags", (event, arg) => {
	data = arg;

	console.log("save received.");

	tagdata[data.id]=data.new_data;
	console.log("new data: "+data.new_data)

	fs.writeFile("tags.json",JSON.stringify(tagdata), function (err) 
	{
		if (err) throw err;
		console.log('Replaced!')
	})
	console.log("new data: "+JSON.stringify(tagdata))

	win.webContents.send("new_tagdata",tagdata)
})

let rapidMode = false
ipcMain.on("rapidMode", (event, arg) => {
	rapidMode = arg

	win.webContents.send("newRapidMode",arg)
})

let favd = false
let settingsWindow = false

ipcMain.on("requestSettings", (event,arg) => {
	settingsWindow = new BrowserWindow({width: 800, height: 600, webPreferences: {devTools: true, nodeIntegration: true, contextIsolation: false}})

	settingsWindow.setMenu(null)

	settingsWindow.loadFile('settings.html')
})

ipcMain.on("update_stars", (event,arg) => {
	favd = arg
	if (settingsWindow){
		settingsWindow.webContents.send("new_stardata",favd)
	}
	
})

ipcMain.on("requestSaveFav",(event)=>{
	if (!favd){
		return
	}

	result = dialog.showOpenDialogSync({
		title:"Save favorited images",
		buttonLabel:'Select this folder',
		properties:[
			'openDirectory'
		]
	})

	if (result){
		result = result[0]
		favKeys = Object.keys(favd)
		favKeys.forEach(function(item,ind){
			perCount = fileext = item.split(".").length
			fileext = item.split(".")[perCount-1]
			if (fs.existsSync(resolve(__dirname+"/"+item)))
			{
				console.log("Starting copy from ",resolve(__dirname+"/"+item), "To" , result+"/file_"+ind+"."+fileext)
				fs.copyFile(resolve(__dirname+"/"+item), result+"/file_"+ind+"."+fileext, fs.constants.COPYFILE_EXCL, function(err){
					if (err){
						console.error(err)
					}
				})
			}else{
				console.error("Couldn't find ",__dirname+"/"+item)
			}
		})
	}
})

setTimeout(createWindow,100)
fs = require("fs")

file = fs.readFileSync("alltags.JSON").toString()
tags = JSON.parse(file)

file_files = fs.readFileSync("tags.json").toString()
file_json = JSON.parse(file_files)
file_keys = Object.keys(file_json)

file_keys.forEach(function(key){
	thisFile = file_json[key]
	thisTags = thisFile.split(" ")
	thisTags.forEach(function(tag,ind){
		thisTags.forEach(function(tag2,ind2){
			if (ind!=ind2 && tag!=tag2 && tags[tag]){
				if (!tags[tag].affinity){
					tags[tag].affinity = {}
				}

				if (!tags[tag].affinity[tag2]){
					tags[tag].affinity[tag2] = 0
				}

				tags[tag].affinity[tag2] += 1
			}
		})
	})
})

fs.writeFileSync("affinities.JSON",JSON.stringify(tags,null,2))
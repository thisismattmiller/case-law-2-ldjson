const H = require ('highland')
const glob = require ('glob')
const fs = require ('fs')
const caseXmlToJson = require('./lib_case_xml_to_json')
const args = process.argv;

var path = `${args[2]}/**`

var output = fs.createWriteStream('output.ndjson')

glob(`${path}/*.xml`, function (er, files) {

	var parseFile = function(file,callback){
		fs.readFile(file, (err, data) => {
		  if (err) throw err
		  	console.log(file)
		  var json = caseXmlToJson.parseXml(data.toString(), file,(err,results)=>{
		  	callback(null,results)
		  })
		})

	}


	H(files)
		.map(H.curry(parseFile))
	  .nfcall([])
	  .parallel(10)
	  .map((results) =>{
	  	// console.log(results)
	  	return JSON.stringify(results) + '\n'
	  })
	  .pipe(output)
	  

})


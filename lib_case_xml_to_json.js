const parseString = require('xml2js').parseString
const path = require('path')

var allFields = []

module.exports = {
  parseXml: function(xml,fileName,callback) {
  	var self = this

  	var results = {}
  	this.xmlText = xml



  	xml = xml.replace(/<footnotemark>/gi,'{footnotemarkstart}').replace(/<\/footnotemark>/gi,'{footnotemarkend}')

		parseString(xml, function (err, result) {
			results.case = self.parseCaseData(result)
			results.caseBody = self.parseCaseBody(result)
			results.sourceFile = path.basename(fileName)
			results.sourceLocalPath = fileName
		  callback(null,results)
		})
    
  },


  parseLine: function(element){
  	var results = []
  	// console.log(element)
  	element.forEach((item)=>{
  		var parsed = {'pgmap':null,'id':null,'value':null}
  		if (item['$'] && item['$'].pgmap) parsed.pgmap = item['$'].pgmap
  		if (item['$'] && item['$'].id) parsed.id = item['$'].id

  		if (item['_']) parsed.value = item['_']
  		results.push(parsed)
  	})

  	return results
  },

  parseCaseBody: function(obj){
  	var self = this

  	var caseBodyResults = false

  	if (obj && obj['mets'] && obj['mets'] && obj['mets']['fileSec']){

  		if (obj['mets']['fileSec'].length > 1) console.error("More than one fileSec!!!")

  		if (obj['mets']['fileSec'] && obj['mets']['fileSec'][0] && obj['mets']['fileSec'][0].fileGrp){
  			
  			obj['mets']['fileSec'][0].fileGrp.forEach((file) =>{
  				if (file && file['$'] && file['$'].USE && file['$'].USE === 'casebody'){

  					if (file.file.length > 1) console.error('More than one file in casebody')

  					var caseBodyId = false
  					var caseBodyNamespace = false
  					var caseBodyFirstPage = false
  					var caseBodyLastPage = false
  					var caseBodyHeader = {}
  					var caseBodyFootNoteIndex = {}
  					var orderBody = 0

  					if (file.file[0] && file.file[0]['$'] && file.file[0]['$'].ID) caseBodyId = file.file[0]['$'].ID


  					if (file.file[0] && file.file[0].FContent && file.file[0].FContent){

  						if (file.file[0].FContent.length > 1) console.log("There are more than one FContent!!!")

  						if (file.file[0].FContent[0] && file.file[0].FContent[0].xmlData){

  							if (file.file[0].FContent[0].xmlData.length > 1) console.log("There are more than one xmlData!")	

  							if (file.file[0].FContent[0].xmlData[0] && file.file[0].FContent[0].xmlData[0].casebody){
  								
  								if (file.file[0].FContent[0].xmlData[0].casebody.length > 1) console.log("There are more than one casebody!")

  								// console.log())

  								// console.log(file.file[0].FContent[0].xmlData[0].casebody[0])

  								Object.keys(file.file[0].FContent[0].xmlData[0].casebody[0]).forEach((key) =>{
  									var element = file.file[0].FContent[0].xmlData[0].casebody[0][key]
  									var footNoteSentences = []
  									// don't do the opinions yet
  									if (key !== 'opinion' && key !== 'footnote' && key !== '$'){

	  									caseBodyHeader[key] = self.parseLine(element)
	  									caseBodyHeader[key].forEach((x)=>{
	  										x.order = ++orderBody
	  									})

	  									caseBodyHeader[key].forEach((x)=>{
		  									if (x.value.search('{footnotemarkstart}')>-1){
		  										var words = x.value.split(/\s/)
		  										var notedSentence = []
		  										words.forEach((word)=>{
		  											if (word.search('{footnotemarkstart}')>-1){
		  												notedSentence.push(word)
		  												footNoteSentences.push(notedSentence.join(' '))
		  											}else{
		  												notedSentence.push(word)
		  											}
		  										})
		  									}
	  									})


  									}else if (key === '$'){
  										if (element.xmlns) caseBodyNamespace = element.xmlns
  										if (element.xmlns) caseBodyFirstPage = element.firstpage
  										if (element.xmlns) caseBodyLastPage = element.lastpage
  									}else if (key === 'footnote'){
  										// console.log(element)

  										if (!caseBodyHeader[key]){
  											caseBodyHeader[key] = []
  										}


  										element.forEach((footnote) => {
  											var mark = false
  											var processed_footnote = false

  											if (footnote && footnote['$'] && footnote['$'].label){
  												mark = footnote['$'].label
  											}else{
  												console.log('No footnote label found!', footnote)
  											}
  											if (footnote && footnote['p']){
  												processed_footnote = self.parseLine(footnote['p'])
  											}else{
  												console.error('No footnote p tags found!')
  											}
  											caseBodyHeader[key].push({note:processed_footnote,mark: mark,context: caseBodyFootNoteIndex[mark], order: ++orderBody})
  										})


  									}else if (key === 'opinion'){

  										// stores it all
  										var opinionBodyData = {type: false}
  										var orderOpinion = 0

  										element.forEach((opinion)=>{
  											
  											var opinionBodyFootNoteIndex = {}
  											

	  										Object.keys(opinion).forEach((oKey)=>{


	  											
	  											var opinionBody = {}
	  											var footNoteSentences = []
	  											

	  											if (oKey === '$'){
	  												if (opinion[oKey].type) opinionBodyData.type = opinion[oKey].type

	  											}else if (oKey === 'footnote'){

	  												opinionBody[oKey] = []
			  										opinion[oKey].forEach((footnote) => {
			  											var mark = false
			  											var processed_footnote = false



			  											if (footnote && footnote['$'] && footnote['$'].label){
			  												mark = footnote['$'].label
			  											}else{
			  												console.log('No footnote label found!', footnote)
			  											}
			  											if (footnote && footnote['p']){
			  												processed_footnote = self.parseLine(footnote['p'])
			  											}else{
			  												console.error('No footnote p tags found!')
			  											}
			  											opinionBody[oKey].push({note:processed_footnote,mark: mark,context: opinionBodyFootNoteIndex[mark], order: ++orderOpinion})
			  										})


	  											}else{

	  												var opinionText = self.parseLine(opinion[oKey])

	  												opinionBody[oKey] = opinionText

				  									opinionText.forEach((x)=>{
				  										x.order = ++orderOpinion
					  									if (x.value.search('{footnotemarkstart}')>-1){
					  										var words = x.value.split(/\s/)
					  										var notedSentence = []
                                var wordCount = -1
					  										words.forEach((word)=>{
                                  wordCount++
					  											if (word.search('{footnotemarkstart}')>-1){

                                    notedSentence.push(word)
                                    // for strange footnote marks like "{footnotemarkstart}|| ||{footnotemarkend}"
                                    if (word.search('{footnotemarkend}')===-1){
                                      if (words[wordCount+1] && words[wordCount+1].search('{footnotemarkend}') > -1){
                                        notedSentence.push(words[wordCount+1])
                                      }else if (words[wordCount+2] && words[wordCount+2].search('{footnotemarkend}') > -1){
                                        notedSentence.push(words[wordCount+1])
                                        notedSentence.push(words[wordCount+2])
                                      }
                                    }
					  												footNoteSentences.push(notedSentence.join(' '))
					  											}else{
					  												notedSentence.push(word)
					  											}
					  										})
					  									}
				  									})
	  											}


				  								if (footNoteSentences.length>0){
			  										footNoteSentences.forEach((aNote)=>{
			  											var note = aNote.match(/\}(.*?)\{/g)
			  											note.forEach((n)=>{
			  												n = n.replace('{','').replace('}','')
			  												opinionBodyFootNoteIndex[n] = aNote.replace('{footnotemarkstart}','').replace('{footnotemarkend}','')
			  											})	
			  										})
			  									}

			  									Object.keys(opinionBody).forEach((k)=>{
			  										if (!opinionBodyData[k]) opinionBodyData[k] = []
			  										opinionBody[k].forEach((d)=>{
			  											opinionBodyData[k].push(d)
			  										})
			  									})
	  										})

	  										if (!caseBodyHeader.opinion) caseBodyHeader.opinion = []
	  										caseBodyHeader.opinion.push(opinionBodyData)

  										})




  										// self.xmlText
  									}else{
  										console.log("Not handeling key:",key)
  									}

  									if (footNoteSentences.length>0){
  										footNoteSentences.forEach((aNote)=>{
  											var note = aNote.match(/\}(.*?)\{/g)
  											note.forEach((n)=>{
  												n = n.replace('{','').replace('}','')
  												caseBodyFootNoteIndex[n] = aNote.replace('{footnotemarkstart}','').replace('{footnotemarkend}','')
  											})	
  										})
  									}
  								})
								
  								
									// console.log(caseBodyHeader)


									//   '$',
									//   'docketnumber',
									//   'parties',
									//   'decisiondate',
									//   'otherdate',
									//   'attorneys',
									//   'opinion',
									//   'p',
									//   'headnotes',
									//   'footnote',
									//   'summary',
									//   'syllabus',
									//   'history',
									//   'disposition'


  								Object.keys(file.file[0].FContent[0].xmlData[0].casebody[0]).forEach((key)=>{
  									if (allFields.indexOf(key)===-1) allFields.push(key)
  								})
  							}


  						}
  						// console.log(caseBodyHeader)
  					}


  					// var caseBodyId = false
  					// var caseBodyNamespace = false
  					// var caseBodyFirstPage = false
  					// var caseBodyLastPage = false
  					// var caseBodyHeader = {}

  					caseBodyResults = {
  						caseBodyId: caseBodyId,
  						caseBodyNamespace : caseBodyNamespace,
  						caseBodyFirstPage : caseBodyFirstPage,
  						caseBodyLastPage : caseBodyLastPage,
  						caseBodyHeader : caseBodyHeader
  					}
  					
  				}
  			})

  		}

  	}else{
  		console.error('Bad Path',"obj && obj['mets'] && obj['mets'] && obj['mets']['fileSec']")
  	}

  	return caseBodyResults
  },

  parseCaseData: function(obj){
  	// console.log(obj)

  	var caseDataResults = false

  	if (obj && obj['mets'] && obj['mets'] && obj['mets']['dmdSec']){
  		obj['mets']['dmdSec'].forEach((dmdSec) =>{

  			if (dmdSec['$'] && dmdSec['$'].ID && dmdSec['$'].ID === 'case' && dmdSec.mdWrap){
  				
  				// assuming there is only one case data per file!!!
  				dmdSec.mdWrap.forEach((mdWrap) =>{

  					if (mdWrap['$'] && mdWrap['$'].OTHERMDTYPE && mdWrap['$'].OTHERMDTYPE === 'HLS-CASELAW-CASEXML' ){
  						if (mdWrap.xmlData.length>1) console.error("Multiple mdWrap.xmlData!! only reading the first one")
  						

  						if (mdWrap.xmlData[0] && mdWrap.xmlData[0]['case']){
  							var caseData = mdWrap.xmlData[0]['case']
  							if (caseData.length > 1) console.log("Multiple case data only reading the first one")
  							caseData = caseData[0]

  							var caseId = false
  							var caseNamespace = false
  							var publicationStatus = false
  							var courtAbbreviation = false
  							var courtJurisdiction = false
  							var courtName = false
  							var caseAbbreviation = false
  							var caseName = false
  							var docketNumber = false
  							var citationType = false
  							var citationCategory = false
  							var citation = false
  							var decisionDate = false

  							if (caseData['$'] && caseData['$'].caseid) caseId = caseData['$'].caseid
  							if (caseData['$'] && caseData['$'].xmlns) caseNamespace = caseData['$'].xmlns
  							if (caseData['$'] && caseData['$'].publicationstatus) publicationStatus = caseData['$'].publicationstatus

  							if (caseData.court.length > 1) console.log("Multiple courts, using the first one!!")
  								
  							if (caseData.court && caseData.court[0] && caseData.court[0]['_']) courtName = caseData.court[0]['_']
  							if (caseData.court && caseData.court[0] && caseData.court[0]['$'] && caseData.court[0]['$']['abbreviation']) courtAbbreviation = caseData.court[0]['$']['abbreviation']
  							if (caseData.court && caseData.court[0] && caseData.court[0]['$'] && caseData.court[0]['$']['jurisdiction']) courtJurisdiction = caseData.court[0]['$']['jurisdiction']

  							if (caseData.name.length > 1) console.log("Multiple case names, using the first one!!")
  							if (caseData.name && caseData.name[0] && caseData.name[0]['_']) caseName = caseData.name[0]['_']
  							if (caseData.name && caseData.name[0] && caseData.name[0]['$'] && caseData.name[0]['$'].abbreviation) caseAbbreviation = caseData.name[0]['$'].abbreviation

  							if (caseData.docketnumber.length > 1) console.log("Multiple docketnumber, using the first one!!")

  							if (caseData.docketnumber && caseData.docketnumber[0] && caseData.docketnumber[0].trim() != '' ) docketNumber = caseData.docketnumber[0]

  							if (caseData.citation.length > 1) console.log("Multiple citation, using the first one!!")

  							if (caseData.citation && caseData.citation[0] && caseData.citation[0]['_']) citation = caseData.citation[0]['_']
  							if (caseData.citation && caseData.citation[0] && caseData.citation[0]['$'] && caseData.citation[0]['$'].category) citationCategory = caseData.citation[0]['$'].category
  							if (caseData.citation && caseData.citation[0] && caseData.citation[0]['$'] && caseData.citation[0]['$'].type) citationType = caseData.citation[0]['$'].type


  							if (caseData.decisiondate.length > 1) console.log("Multiple decisionDate, using the first one!!")

  							if (caseData.decisiondate && caseData.decisiondate[0]) decisionDate = caseData.decisiondate[0]

  							caseDataResults = {
  								caseId: caseId,
  								caseNamespace: caseNamespace,
  								publicationStatus: publicationStatus,
  								courtAbbreviation: courtAbbreviation,
  								courtJurisdiction: courtJurisdiction,
  								courtName: courtName,
  								caseAbbreviation: caseAbbreviation,
  								caseName: caseName,
  								docketNumber: docketNumber,
  								citationType: citationType,
  								citationCategory: citationCategory,
  								citation: citation,
  								decisionDate: decisionDate
  							}

  						}else{
  							console.error('Path not found',"mdWrap.xmlData[0].case")
  						}
  					}else{
  						console.error('Path not found', "mdWrap['$'] && mdWrap['$'].OTHERMDTYPE && mdWrap['$'].OTHERMDTYPE === 'HLS-CASELAW-CASEXML'")
  					}
  				})
  			}else{
  				console.error('Path not found',"dmdSec['$'] && dmdSec['$'].ID && dmdSec['$'].ID === 'case' && dmdSec.mdWrap")
  			}
  		})
  	}
  	return caseDataResults
  }
      
}
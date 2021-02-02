const uploadCommands = {
  local: function (title,fileType,fileName,chunkSize,chunkPause,threads,skip,stream,insertType,submitPause) 
   {
      return this.fillAndSubmitLocal (title,fileType,fileName,chunkSize,chunkPause,threads,skip,stream,insertType,submitPause);
  },
  fillAndSubmitLocal: function (title, fileType,fileName, chunkSize,chunkPause,
                            threads,skip,stream,insertType,submitPause) 
  {
        let l_fileTypeClickID = '@'+fileType+'FileTypeClick';
        let l_fileTypeID = '@'+fileType+'FileType';
        let l_fileID = '@' + fileType + 'FileID'
        var l_parsedRowCount =0, l_insertedRowCount =0;
        var l_status ='';
        var l_uploadID = '';

        return this
            .waitForElementVisible('body')
            .assert.titleContains(title)
            .click(l_fileTypeClickID)
            .setValue(l_fileTypeID, fileType)
            .setValue(l_fileID,fileName)         
            .click('@chunkSizeClick')
            .pause(chunkPause)
            .click('option[value='+'"'+chunkSize+'"]')
            .setValue('@threads',threads)
            .setValue('@skip',skip)
            .click('@streamClick')
            .pause(chunkPause)
            .click('option[value='+'"'+stream+'"]')
            .click('@insertTypeClick')
            .pause(chunkPause)
            .click('option[value='+'"'+insertType+'"]')
            .assert.visible('@submit')
            .click('@submit')
            .pause(submitPause)
            .getValue('@status',function (result) { 
                l_status = result.value; 
                console.log('status',l_status);
                })
            .getValue('@parsedRowCount', function (result) { 
                l_parsedRowcount = result.value;
                 console.log('parsedRowCount',l_parsedRowcount);
                })
            .getValue('@insertedRowCount', function (result) {
                 l_insertedRowCount = result.value;
                 console.log('insertedRowCount',l_insertedRowCount)
                })
            .getValue('@uploadID', function (result) {
                l_uploadID = result.value;
                this.assert.ok(l_uploadID.length > 0), ' upload ID is valid';
                console.log('uploadID',l_uploadID)
                })    
            .assert.equal(l_parsedRowCount, l_insertedRowCount, 'parsed and inserted rowcount match')
            .pause(1000)
            .assert.attributeEquals('@status','value','complete')
            .assert.containsText('@result', '100%') 
            .assert.containsText('@result', l_insertedRowCount) 
            
    },
    remote: function (title,fileType,fileName,chunkSize,chunkPause,threads,skip,stream,insertType,submitPause) 
    {
       return this.fillAndSubmitRemote (title,fileType,fileName,chunkSize,chunkPause,threads,skip,stream,insertType,submitPause);
   },
   fillAndSubmitRemote: function (title, fileType,fileName, chunkSize,chunkPause,
                             threads,skip,stream,insertType,submitPause) 
   {
         let l_fileTypeClickID = '@'+fileType+'FileTypeClick';
         let l_fileTypeID = '@'+fileType+'FileType';
         let l_fileID = '@' + fileType + 'FileID'
         var l_parsedRowCount =0, l_insertedRowCount =0;
         var l_status ='';
         var l_uploadID = '';
 
         return this
             .waitForElementVisible('body')
             .assert.titleContains(title)
             .click(l_fileTypeClickID)
             .setValue(l_fileTypeID, fileType)
             //.click('@urlClick')
             .pause(chunkPause)
             //.click('option[value='+'"'+fileName+'"]')  
             .setValue('@url',fileName)       
             .click('@chunkSizeClick')
             .pause(chunkPause)
             .click('option[value='+'"'+chunkSize+'"]')
             .setValue('@threads',threads)
             .setValue('@skip',skip)
             .click('@streamClick')
             .pause(chunkPause)
             .click('option[value='+'"'+stream+'"]')
             .click('@insertTypeClick')
             .pause(chunkPause)
             .click('option[value='+'"'+insertType+'"]')
             .assert.visible('@submit')
             .click('@submit')
             .pause(submitPause)
             .getValue('@status',function (result) { 
                 l_status = result.value; 
                 console.log('status',l_status);
                 })
             .getValue('@parsedRowCount', function (result) { 
                 l_parsedRowcount = result.value;
                  console.log('parsedRowCount',l_parsedRowcount);
                 })
             .getValue('@insertedRowCount', function (result) {
                  l_insertedRowCount = result.value;
                  console.log('insertedRowCount',l_insertedRowCount)
                 })
             .getValue('@uploadID', function (result) {
                 l_uploadID = result.value;
                 this.assert.ok(l_uploadID.length > 0), ' upload ID is valid';
                 console.log('uploadID',l_uploadID)
                 })    
             .assert.equal(l_parsedRowCount, l_insertedRowCount, 'parsed and inserted rowcount match')
             .pause(1000)
             .assert.attributeEquals('@status','value','complete')
             .assert.containsText('@result', '100%') 
             .assert.containsText('@result', l_insertedRowCount) 
             
     }
 


    
}

module.exports = {
  url: 'https://gopalmallya.com/ords/r/gopalmallya/csv2table',
  commands: [uploadCommands],
  elements: {
    title:"Home",  
    localFileTypeClick: 'label[For="P9_FILETYPE_0"]',
    localFileType: '#P9_FILETYPE_0',
    localFileID: '#P9_FILE',
    remoteFileTypeClick: 'label[For="P9_FILETYPE_1"]',
    remoteFileType: '#P9_FILETYPE_1',
    remoteFileID: '#P9_URL',
    chunkSizeClick: '#P9_CHUNKSIZE',
    threads: '#P9_THREADS',
    skip: '#P9_SKIPFIRSTNROWS',
    streamClick: '#P9_STREAM',
    result: '.progressBarPCT',
    submit: 'button[id=submit]',
    parsedRowCount:'#P9_PARSED_ROWCOUNT',
    insertedRowCount:'#P9_INSERTED_ROWCOUNT',
    status:'#P9_STATUS',
    uploadID:'#P9_UPLOAD_ID',
    insertTypeClick:'#P9_INSERT_TYPE',
    urlClick:'#P9_URL_lov_btn',
    url:'#P9_URL'
  }
}
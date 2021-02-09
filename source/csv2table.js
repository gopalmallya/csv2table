/* @license
csv2table
v1.0.0
https://github.com/gopalmallya/apex/tree/main/csv2table
https://gopalmallya.com/ords/r/gopalmallya/csv2table
License: MIT
*/

//Module revealing pattern, returns upload, config, status, pause and resume function
var csv2table = ( function($){
    var stepped = 0, chunked = 0, parsedRowCount = 0, parseErrorCount = 0, insertErrorCount = 0, insertRequestPendingCount = 0, insertRequestCompletedCount= 0,  insertedRowCount = 0, errorCallBackCount = 0, remoteStreamParserCompleted = 0, firstError;
    var start, end, ajaxEnd;
    var pausedByUser = false;
    var firstRun = true;
    var threads ; //maximum number of parsed chunk of stream array , to trigger ajax call processing
    var totalChunks = 0;
    var submitButtonID;
   
    var uploadID;
    var skipFirstNRows = 0;
    var stream = 'Y';

    var insertType , chunkFormat; //json_table or xmlparse
    

    var filename, filesize, filetype, fileCount;
    var filesArr = [];
    var status = {
        state: "",
        where: ""
    }

    var error = {
        type: "",     // A generalization of the error
        code: "",     // Standardized error code
        message: "",  // Human-readable details
        row: 0,       // Row index of parsed data where error is
        file: "",
        err: ""
        
    }
    
    var ajaxIdentifier;
    var complete_callback_fn, chunk_inserted_callback_fn, error_callback_fn;
    var config = {};
    var callBackReturnObject = {
            
            "options" : function() { return config; },
            "uploadID" : function () { return uploadID; },
            "files"     : function() { return filesArr; },
            "fileCount" : function() { return fileCount; },
            "totalChunks" : function() { return totalChunks; },
            "chunked"     : function() { return chunked; },
            "parsedRowCount"     : function() { return parsedRowCount; },
            "insertedRowCount" : function() { return insertedRowCount; },
            "parsedErrorCount" : function() { return parseErrorCount; },
            "insertedErrorCount" : function() { return insertedErrorCount; },
            "startTime" : function() { return start; },
            "endTime" : function() { return ajaxEnd; },
            "progressSoFar" : function() {
                                if ( totalChunks > 0 ) {
                                    return chunked/totalChunks;
                                } 
                                if ( totalChunks === 0 && remoteStreamParserCompleted > 0  ) {
                                     return 1;   
                                } else {
                                    if ( insertedRowCount > 0) {
                                        return parsedRowCount/insertedRowCount;
                                    }
                                }   
                        } ,
            "error" : {},
            "status" : {},
            "parseResults" : {},
            "halted" : function() {
                if ( typeof parser === "object" && typeof parser.pause === "function") {
                    return parser.paused();
                }
            },
            "completed" : function() {
                    if ( chunked == totalChunks ){
                        return true;
                    } else {
                        return false;
                    }
            }
                             
    };

    
    function buildConfig(options)
    {
        config = {
            delimiter: ',',
            header: false,
            chunk : chunkFn,
            complete: completeFn,
            error: errorFn, 
            skipEmptyLines: true,
            
        };    

     
        if ( options ) {
                // copy properties of `options` to `config`. Will overwrite existing ones.
                for(var prop in options.pageItems) {
                    if(options.pageItems.hasOwnProperty(prop)){
                        config[prop] = options.pageItems[prop];
                    }
                }
                for(var prop in options) {
                    if(options.hasOwnProperty(prop)){
                        config[prop] = options[prop];
                    }
                }
                
        }
        if ( config.fileType == 'remote') {
            config.download = true;  
        }  

        return config;
    }

    
    //file parser enqueue into queue ajax plsql call dequeues
    function Queue() {
        this.elements = [];
     }
     
     Queue.prototype.enqueue = function (e) {
        this.elements.push(e);
     };
     
     // remove an element from the front of the queue
     Queue.prototype.dequeue = function () {
         return this.elements.shift();
     };
     
     Queue.prototype.isEmpty = function () {
         return this.elements.length == 0;
     };
     
     // get the element at the front of the queue
     Queue.prototype.peek = function () {
         return !this.isEmpty() ? this.elements[0] : undefined;
     };
     
     Queue.prototype.length = function() {
         return this.elements.length;
     }
     Queue.prototype.size = function() {
        return this.elements.join('').length;
    }
     //the parsed chunk is enqueue in queue
     let q = new Queue();
     

    //everything starts here, after user clicks submit, build and override config, parse, insert
    async function submit (daContext, options, initFn)
        {
            
            config = buildConfig(options);
            //overriden by user in js init
            if (initFn instanceof Function) {
                initFn.call(daContext, config);
            }
            
            if (config.stream == 'N') {
                config.chunk = undefined;
            }
            
            if ( config.fileType == 'remote') {
                config.download = true;  
            } 
            

            ajaxIdentifier = config.ajaxId;
            config.buttonID = daContext.triggeringElement.id;
            submitButtonID = config.buttonID;
            fileType = config.fileType;
            fileID = config.fileID;
            threads =  config.threads;
            chunkSize = config.chunkSize;
            chunkFormat = config.chunkFormat;
            insertType = config.insertType;
            complete_callback_fn = config.complete_callback_fn;
            error_callback_fn = config.error_callback_fn;
            chunk_inserted_callback_fn = config.chunk_inserted_callback_fn;
            skipFirstNRows = config.skipFirstNRows;
            stream = config.stream;

            var getUploadIDPromise;
            getUploadIDPromise =     apex.server.plugin(
                ajaxIdentifier, 
                {x03:'getUploadID' },
                {dataType:"text"}
            );

            try {
                var getUploadIDResult = await getUploadIDPromise.done ( function (result){
                    data = JSON.parse(result);
                    uploadID = data.uploadID;    
                });
            } catch(err) {
                    error.type = "upload ID";
                    error.code = "gettingUploadID";
                    error.message = "Error getting upload ID from csv2table sequence";
                    callBackReturnObject.error  = error;
                    status.state = "error";
                    status.where = "gettingUploadID";
                    callBackReturnObject.status = status;
                    error_callback_fn(callBackReturnObject);
                    return;

            }

            config.uploadID = uploadID;

            stepped = 0;
            chunked = 0;
            totalChunks = 0;
            parsedRowCount = 0;
            parseErrorCount = 0;
            insertRequestCompletedCount = 0;
            insertErrorCount = 0;
            insertRequestPendingCount = 0; 
            insertRequestCompletedCount= 0;  
            insertedRowCount = 0; 
            errorCallBackCount = 0;
            firstError = undefined;

            var input = $('#' + fileID).val();
            if (firstRun) {
                firstRun = false;
            }    
            //parse stream
            if ( fileType == 'local' ) {

                if (!$('#' + fileID)[0].files.length)
                {
                    
                    error.type = "load";
                    error.code = "fileLoadingError";
                    error.message = "Please choose at least one file to parse";
                    callBackReturnObject.error  = error;
                    status.state = "error";
                    status.where = "fileRead";
                    callBackReturnObject.status = status;
    
    
                    error_callback_fn(callBackReturnObject);
                    return;
                }
                
                fileCount = $('#' + fileID)[0].files.length;
    
                $('#' + fileID).parse({
                    config: config,
                    before: function(file, inputElem)
                    {
                        start = now();
                        filename = file.name;
                        filesize = file.size;
                        filetype = file.type;
                        filesArr.push({ "filename" : filename, "filesize" : filesize, "filetype" :filetype});
                        totalChunks = totalChunks + Math.ceil(filesize/config.chunkSize);
                        ajaxCallCounter = 0;
                            
                        

                    },
                    error: function(err, file)
                    {
                        firstError = firstError || err;
                        parseErrorCount++;
                        error.type = "load";
                        error.code = "loadingFile";
                        error.message = "Error when loading the file "
                        error.file = file;
                        error.err = err;
                        callBackReturnObject.error =  error;
                        status.state = "error";
                        status.where = "parse";
                        callBackReturnObject.status = status;
        

                        error_callback_fn(callBackReturnObject);
                    },
                    complete: function()
                    {
                        
                        end = now();
                        
                    }
                });
            }
            if ( config.fileType == 'remote' ) {

                urlArray = input.split(',');
                if ( urlArray.length == 2 ) {
                    input = urlArray[0];
                    filename = urlArray[0];
                    filesize = urlArray[1];
                    filesArr.push({ "filename" : filename, "filesize" : filesize, "filetype" :fileType});
                    totalChunks = totalChunks + Math.ceil(filesize/config.chunkSize);
                    ajaxCallCounter = 0;
                        
                }
                if ( urlArray.length == 1 ) {
                    input = urlArray[0];
                    filename = urlArray[0];
                    filesArr.push({ "filename" : filename, "filesize" : filesize, "filetype" :fileType});
                    totalChunks = 0;
                    ajaxCallCounter = 0;
                        
                }

                start = now();
                var results = Papa.parse(input, config);
            }    
            
        }

    //not used, useful during troubleshooting    
    function printStats(msg)
    {
        if (msg)
            console.log(msg);
        console.log("       Time:", (end-start || "(Unknown; your browser does not support the Performance API)"), "ms");
        
        console.log("  Row count:", parsedRowCount);
        if (stepped)
            console.log("    Stepped:", stepped);
        if (chunked)
            console.log("    Chunked:", chunked);    
        console.log("     Errors:", parseErrorCount);
        if (parseErrorCount)
            console.log("First error:", firstError);
    }

    //called after all papa parsing is done, inserts happen here for Stream=No
    async function completeFn(results)
    {
        end = now();

        if (results && results.errors)
        {
            if (results.errors)
            {
                parseErrorCount = results.errors.length;
                firstError = results.errors[0];
            }
            if (results.data && results.data.length > 0)
                parsedRowCount = results.data.length;
        }
        if (stream == 'N') //if not streaming
        {
            if (results.errors.length > 0)
            {
                parseErrorCount = parseErrorCount + results.errors.length;
                firstError = firstError || results.errors[0];
                error.type = "parse";
                error.code = "parsingError";
                error.message = "Error when parsing file";
                callBackReturnObject.parseResults = results;
                callBackReturnObject.error =  error;
                status.state = "error";
                status.where = "parseStream";
                callBackReturnObject.status = status;
                callBackReturnObject.totalChunks = totalChunks;
                callBackReturnObject.chunked = chunked;
                if ( errorCallBackCount === 0 ) {
                        error_callback_fn(callBackReturnObject);
                    } 
                errorCallBackCount++;   
            } else {
                if (results.data && results.data.length > 0 ) {
                    if ( skipFirstNRows > 0 ) {
                        results.data = results.data.splice(skipFirstNRows);
                    }    
                    parsedRowCount =  results.data.length;
                    chunked = 0;
                    totalChunks = 0;
                    let chunkArray =[];
                    if ( results.data[0].join('').length * results.data.length <= chunkSize ) {
                        q.enqueue(results.data);
                        chunked++;
                        totalChunks = chunked;
                        await insert(results);

                    } else {
                        for (i=0; i < results.data.length;i++) { 
                            chunkArray.push(results.data[i]);
                            if ( chunkArray.join('').length > chunkSize ) {
                                q.enqueue(chunkArray);
                                chunkArray = [];
                                chunked++;
                                if ( i + 1 == results.data.length) {
                                    totalChunks = chunked;
                                }       
                                else {//keep total chunks > chunked 
                                    totalChunks = chunked + 1;
                                }    
                            } 
                            
                            if ( i + 1 == results.data.length ) { 
                                q.enqueue(chunkArray);
                                chunked++;
                                totalChunks = chunked;
                            }                               
                            if (  q.length() >= threads || i + 1 == results.data.length ) { 
                                await insert(results);
                            }
                                    
                        }    
                    }        
                }    
            }  

        }
    }

    //any error thrown by papaparse
    function errorFn(err, file)
    {
        end = now();

        error.type = "parse";
        error.code = "parsingFile";
        error.message = "Error raised during file parse "
        error.file = file;
        error.err = err;
        callBackReturnObject.error =  error;
        status.state = "error";
        status.where = "parse";
        callBackReturnObject.status = status;


        error_callback_fn(callBackReturnObject);

    }



    function now()
    {
        return typeof window.performance !== 'undefined'
                ? window.performance.now()
                : 0;
    }

    //dequeue, convert to configured format, ajax call to insert, wait till all ajax promise resolved
    //, call error, chunk and complete callback function
    var insert = async function (results,parser) {
        var insertPromise;
        var insertPromiseArray = [];
        var ajaxInputData;

        for (j = 0; j < q.length(); j++) {

            if ( insertType == "json" || chunkFormat == "json" ||insertType === undefined) {
                ajaxInputData = JSON.stringify(q.dequeue());
            }
            if ( insertType == "xml" || chunkFormat == "xml") {
                //<r><c1>..</c1>.....<cn>..</cn></r>
                var json2xml = q.dequeue().map(function(r,i){ 
                            return '<r>' + r.map(function(c,j)
                        { return '<c' + j + '>' + '<![CDATA[' + c + ']]>' + '</c' + j + '>'}).join('') + '</r>'  }).join('');
                json2xml = '<xd>'  + json2xml + '</xd>';                  
                ajaxInputData = json2xml;
            }            

            
            if ( insertType == "apex_data_parser"  || chunkFormat == 'csv' ) {
                ajaxInputData = Papa.unparse(q.dequeue()); 
            }    
            
            
            insertPromise =     apex.server.plugin(
                ajaxIdentifier, 
                { p_clob_01: ajaxInputData, x01:filename, x02:uploadID,x04:insertType},
                {dataType:"text"}
            );

            insertPromiseArray.push(insertPromise);    
            insertRequestPendingCount++; //increment when request is sent               
        
        }
        try {
            var insertResultsArray = await Promise.all(insertPromiseArray);
            if ( typeof parser === "object" && typeof parser.resume === "function" ) { 
                let pauseResult = await parser.resume();
            }    

            for (let k = 0; k<insertResultsArray.length; k++){
                let data = JSON.parse(insertResultsArray[k]);
                insertRequestPendingCount--; //decrement when request is completed, 0 means not pending
                insertRequestCompletedCount++; //total count of completed request

                if ( data.status == "error" ) {
                    if (typeof parser === "object" && typeof parser.pause === "function") {
                        let pauseResult = await parser.pause();
                    }    
                    insertErrorCount++;
                    error.type = "insert";
                    error.code = data.sqlcode;
                    error.message = data.sqlerrm;
                    callBackReturnObject.error =  error;
                    callBackReturnObject.parseResults = results;
                    status.state = "error";
                    status.where = "insert";
                    callBackReturnObject.status = status;
                    callBackReturnObject.totalChunks = totalChunks;
                    callBackReturnObject.chunked = chunked;
                    if ( errorCallBackCount === 0 ) {
                        error_callback_fn(callBackReturnObject);
                    }
                    errorCallBackCount++;    
                    break;
                }
                else if (data.status == "success" )    {
                    insertedRowCount = insertedRowCount + data.insertedRowCount;
                    if ( chunked < totalChunks ) {
                        status.state = "chunkInserted";
                       status.where = "insert";
                       callBackReturnObject.status = status;
                       callBackReturnObject.totalChunks = totalChunks;
                       callBackReturnObject.chunked = chunked;
                       callBackReturnObject.parseResults = results;
                       chunk_inserted_callback_fn(callBackReturnObject);    
                   }
                   
                   //remote stream is completed
                   if (  typeof parser === "object"  && 
                         parser.streamer._completed && 
                         stream == 'Y' &&
                         fileType == "remote"  ) {

                            remoteStreamParserCompleted++;
                         }
                   //no more pending ajax calls, and all parsing of chunks done
                   //call complete callback 
                   if ( chunked == totalChunks || remoteStreamParserCompleted > 0 ) {
                       
                       ajaxEnd = now();
                       status.state = "complete";
                       status.where = "insert";
                       callBackReturnObject.status = status;
                       callBackReturnObject.totalChunks = totalChunks;
                       callBackReturnObject.chunked = chunked;
                       callBackReturnObject.parseResults = results;
                       complete_callback_fn(callBackReturnObject);
                       
                   }
                } else {
                    error.type = "insert";
                    error.code = 'statusReturnFailure';
                    error.message = 'Insert failed to return success or error';
                    callBackReturnObject.error =  error;
                    callBackReturnObject.parseResults = results;
                    status.state = "error";
                    status.where = "insert";
                    callBackReturnObject.status = status;
                    callBackReturnObject.totalChunks = totalChunks;
                    callBackReturnObject.chunked = chunked;
                    if ( errorCallBackCount === 0 ) {
                        error_callback_fn(callBackReturnObject);
                    }
                    errorCallBackCount++;    
                    break;

                }

           }

        }catch(err) { //ords returns error like service not available, exhausting sessions..
            if (typeof parser === "object" && typeof parser.pause === "function") {
                let pauseResult = await parser.pause();
            }    

                insertErrorCount++;
                error.type = "insert";
                error.code = "ords error";
                error.message = err;
                callBackReturnObject.error =  error;
                callBackReturnObject.parseResults = results;    
                status.state = "error";
                status.where = "ords server";
                callBackReturnObject.status = status;
                callBackReturnObject.totalChunks = totalChunks;
                callBackReturnObject.chunked = chunked;
                if ( errorCallBackCount === 0 ) {
                    error_callback_fn(callBackReturnObject);
                }    
                errorCallBackCount++;
                   
        }
    }

    
    //called after every papaparse chunk is parsed, enqueue and insert, when stream=Yes
    async function chunkFn(results, parser)
    {
        
        chunked++;
        userPause = function() { 
                    if ( !pausedByUser ) {
                        parser.resume();
                        setTimeout(function(){insert(results,parser);},100);
                    } else {
                        setTimeout(function(){userPause();}, 1000);
                    } 
                } 

        
        if (results)
        {

            if (results.errors.length > 0)
            {
                if ( typeof parser === "object" && typeof parser.pause === "function" ) {
                    let pauseResult = await parser.pause();
                }    

                parseErrorCount +=  results.errors.length;
                firstError = firstError || results.errors[0];
                error.type = "parse";
                error.code = "parsingError";
                error.message = "Error when parsing file";
                callBackReturnObject.parseResults = results;
                callBackReturnObject.error =  error;
                status.state = "error";
                status.where = "parseStream";
                callBackReturnObject.status = status;
                callBackReturnObject.totalChunks = totalChunks;
                callBackReturnObject.chunked = chunked;
                if ( errorCallBackCount === 0 ) {
                        error_callback_fn(callBackReturnObject);
                    } 
                errorCallBackCount++;   
            } else {

                if (results.data ) {
                    if ( chunked === 1 && skipFirstNRows > 0 ) {
                        results.data = results.data.splice(skipFirstNRows);
                    }    
                    parsedRowCount =  parsedRowCount + results.data.length;
                    if ( q.length() < threads ) {
                        q.enqueue(results.data);
                    }    
                    if ( q.length() == threads || q.length() > threads ) {
                        if ( parser ) {
                            let pauseResult = await parser.pause();
                        }    
                                
                        if ( !pausedByUser ) {
                            setTimeout(function() {insert(results,parser);},100);
                        } else {
                            let pauseResult = await parser.pause();
                            setTimeout( function() {userPause();}, 1000);     
                                 
                        }    
                    }  
                    //last chunks
                    if ( q.length() > 0 && chunked == totalChunks ) {  
                        setTimeout(function() {insert(results);},100);
                    }
                    //remote stream parsing finished, last chunk
                    if (  typeof parser === "object"  && 
                            parser.streamer._finished && 
                            stream == 'Y' && 
                            fileType == "remote"  && 
                            q.length() > 0 ) {
                            remoteStreamParserCompleted++        
                            setTimeout(function() {insert(results);},100);
                    }
                        
                }    
            }  

  

        }
    }


    //upload is called from plugin, config, status, pause, resume can be used anywhere in page
    return {
        "upload" : function (daContext, config, initFn) {
                        submit(daContext, config, initFn);
                    },
        "config" : function(options) {
                        buildConfig(options);
                    },
        "status" : function() {
                        return callBackReturnObject;
                    },
        "pause" : function() {
                    pausedByUser = true;
            
        },
        "resume" : function() {
                    pausedByUser = false;
        }
    }    



}

)(apex.jQuery);


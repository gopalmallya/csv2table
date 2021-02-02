# csv2table (1.0 Beta)
 csv2table is Oracle Apex, dynamic action plugin, built to upload large csv datasets into table. 

# Changelog
- 1.0 - Beta

# Demo
- Users can upload local csv file and remote csv using url, monitor the progress and review the inserted records
- Options such as streaming, chunkSize, Threads and PLSQL data parsers, realtime progress monitoring, highlight plugin features
- [ demo ](https://gopalmallya.com/ords/r/gopalmallya/csv2table) 

# Environment
- Tested using Nightwatch/Firefox/Chrome/Oracle DB 19c/Apex 20.2
- The plugin PLSQL code, uses dynamic sql and no version dependent features, to support this functionality on any databases 10g or later
- Work is under progress to test in Oracle DB 11g/Apex 5.x
 
# Install
- Download create_csv2table_seq.sql and csv2table_plugin.sql from [ install directory ](https://github.com/gopalmallya/apex/tree/main/csv2table/install)

- Execute create_csv2table_seq.sql to create “csv2table” table and sequence “csv2table_seq”, in apex parsing schema.    
    ```s
        @create_csv2table_seq.sql
    ``` 
    Note - You can execute this script in another schema of your choice, but please create synonyms for table and sequence.

- Import csv2table_plugin.sql, to install the plugin
    > Login to your Apex workspace → App Builder → Import → Choose “csv2table.sql” → File type → Plug-in → Next → Install Plugin

# Configure
Below is an example plugin configuration to upload local file selected in file browse page item P1_FILE, when user clicks upload button
- Create a FILE Browse page item say P1_FILE, on page 1.
- Create Button say P1_UPLOAD_BTN
- Create dynamic action on P1_UPLOAD_BTN
    - Right click on button → *Create Dynamic Action* → *True Action* → Identification Section , select **csv2table [Plug-in]** in *Action* Drop down
    - *File Type* → Local File
    - *File ID* → P1_FILE
    - *Insert Type*
        - JSON_TABLE (database version 12c or later)
        - APEX_DATA_PARSER ( apex version 19.1 or later)
        - XMLTABLE ( for database version < 12c and apex version < 19.1 )
                  
- For more information on configuration options, select the Option → click Help

## Testing

- Run the page 1
- Choose any csv text file in File browse item
- Click Upload button
- Open browser console log, to view the logs, find and copy upload_id
- SQL Workshp → SQL Commands 
    ```
    select * from csv2table where upload_id = :upload_id;
    ```

# Options
You can change the behaviour of csv2table plugin by configuring options, in dynamic action properties, or  in Advanced -> Javascript initialization Code

|||
|---|---|
**File Type**|<pre>Select **Local File**, for  uploading csv file using File Browse page item. <br>Select **Remote URL** , for uploading csv file using csv download url.</pre>| 
|**File ID**| <pre>To upload local file(s) using File browse page item or html input type=file, enter the **ID** of the input type=file. <br> for e.g. PX_FILE <br>To upload remote file, select the ID of the page item where user can select or type url <br> for e.g. PX_URL <br> **Note** - For remote file the plugin, gets the file content using xmlHTTPRequest and requires Access-Control-Allow-Origin header to be enabled by the source server hosting the csv file. If not enabled,  you will get CORS error thrown by the browser.<pre>
|**Skip First N Rows**|<pre>Enter the number of rows you want to be skipped from the beginning of the csv file.<br>If you enter 1, then 1st record of csv file will be skipped and will not be inserted into table.<pre>|
|**Stream**|<pre>When stream is set to **Yes**, the file will be read and parsed in chunks, per byte size set in **chunkSize** option, keeping client side javascript memory usage low and also speeding up the inserts into table <br>When set to **No** , entire file will be read in javascript memory<br>When FileType is Remote URL, stream = **Yes**, will result in CORS error thrown by browser, unless CORS Access-Control-Allow-Origin header is enabled at the source hosting the csv file.</pre>|
|**chunkSize**|<pre>chunkSize is the number of bytes used by javascript parser (Papaparse) to parse file in chunks at a time, when **Stream** option is set to **Yes**.<br>Ajax thread inserts a single chunk into the csv2table.<br>Please configure the **chunkSize** and **threads** as a combination to tune memory and insert performance.<br>for e.g When chunkSize is set to 1000000 (~1mb), input file will be read and parsed 1mb at a time, a ajax thread will then insert 1mb chunk into csv2table</pre>|
|**Threads**|<pre>Number of parallel ajax sessions to create for inserting the parsed records. Each thread will insert 1 chunk by calling a on demand ajax plsql. When **Stream** is set to **No** , entire file will be read and parsed in javascript object, then it will be chunked and fed to threads to insert into csv2table.</pre>|
|**Insert Type**|<pre>Select **JSON_TABLE**, if your database version is 12c or later<br>Select **APEX_DATA_PARSER** for Apex version is 19.1 or later<br>Select **XMLTABLE**, for database version less than 12c or Apex version less than 19.1<br>select **CUSTOM INSERT**, to write your own implementation using clob containing chunked records in format configured in chunk format option.</pre>|
|**Chunk Inserted Callback Function**|<pre>You can write a javascript function which will be called after, a chunk is inserted. This function contains 1 arguments containing result object. You can use this function and result object to check or display the progress, pause and resume the reading and parsing of the input file.</pre>
```javascript
function afterChunkInsertFn(result) {
    console.log(results.options()); //returns plugin options object
    console.log(results.uploadID()); //returns upload Identifier for records inserted
    console.log(results.files()); //array containing upload file information
    console.log(results.fileCount()); 
    console.log(results.totalChunks()); //total number of chunks to be inserted
    console.log(results.chunked()); // total number of chunks inserted so far
    console.log(results.parsedRowCount()); //total number of rows parsed
    console.log(results.insertedRowCount()); //total number of rows inserted
    console.log(results.parsedErrorCount()); //total number of parsing errors
    console.log(results.insertedErrorCount()); //total number of insert errors
    console.log(results.startTime()); //time when parsing file started
    console.log(results.endTime()); //time when all chunks were inserted
    console.log(results.progressSoFar()); // value betwee 0 and 1, 1 is 100% completed
    console.log(results.error()); // error information
    console.log(results.status()); // status information
    console.log(results.parseResults()); //parsed data in the chunk
    console.log(results.halted()); //true when parser is halted
    console.log(results.completed()); //true when all chunks are inserted
    //you can pause parser and further chunking..   
    if (chunkingNeedsToBePause() || csv2table) { //where chunkingNeedsToBePause() is your function returns true when you want parser to pause
        csv2table.pause();
    }
     
    // do something here.. 

    //you can resume parser and further chunking and inserting
     if (!chunkingNeedsToBePause() || csv2table) { //where chunkingNeedsToBePause() is your function returns true when you want parser to pause
        csv2table.resume();
    }
}
```
|||
|---|---|
|**Error Callback Function**|<pre>You can write a javascript function which will be called if an error is thrown either during parsing the file or inserting into the table. This function contains 1 arguments containing result object. You can use the result object to perform further error processing.</pre>
```javascript
function afterErrorFn(result) {
    console.log(results.options()); //returns plugin options object
    console.log(results.uploadID()); //returns upload Identifier for records inserted
    console.log(results.files()); //array containing upload file information
    console.log(results.fileCount()); 
    console.log(results.totalChunks()); //total number of chunks to be inserted
    console.log(results.chunked()); // total number of chunks inserted so far
    console.log(results.parsedRowCount()); //total number of rows parsed
    console.log(results.insertedRowCount()); //total number of rows inserted
    console.log(results.parsedErrorCount()); //total number of parsing errors
    console.log(results.insertedErrorCount()); //total number of insert errors
    console.log(results.startTime()); //time when parsing file started
    console.log(results.endTime()); //time when all chunks were inserted
    console.log(results.progressSoFar()); // value betwee 0 and 1, 1 is 100% completed
    console.log(results.error()); // error information
    console.log(results.status()); // status information
    console.log(results.parseResults()); //parsed data in the chunk
    console.log(results.halted()); //true when parser is halted
    console.log(results.completed()); //true when all chunks are inserted
}
```
|||
|---|---|
|**Complete Callback Function**|<pre>You can write a javascript function which will be called after file is successfully inserted into table, to continue further processing like refreshing reports, scheduling backend validations, transformation. This function has 1 input argument containing result object</pre>
```javascript
function afterCompleteFn(result) {
    console.log(results.options()); //returns plugin options object
    console.log(results.uploadID()); //returns upload Identifier for records inserted
    console.log(results.files()); //array containing upload file information
    console.log(results.fileCount()); 
    console.log(results.totalChunks()); //total number of chunks to be inserted
    console.log(results.chunked()); // total number of chunks inserted so far
    console.log(results.parsedRowCount()); //total number of rows parsed
    console.log(results.insertedRowCount()); //total number of rows inserted
    console.log(results.parsedErrorCount()); //total number of parsing errors
    console.log(results.insertedErrorCount()); //total number of insert errors
    console.log(results.startTime()); //time when parsing file started
    console.log(results.endTime()); //time when all chunks were inserted
    console.log(results.progressSoFar()); // value betwee 0 and 1, 1 is 100% completed
    console.log(results.error()); // error information
    console.log(results.status()); // status information
    console.log(results.parseResults()); //parsed data in the chunk
    console.log(results.halted()); //true when parser is halted
    console.log(results.completed()); //true when all chunks are inserted
}
```

## Configuration using Javascript Initialization Code
Example below, plugin options are set using page item values
```Javascript
function (options) {
    var chunkSize = apex.item("P1_CHUNKSIZE").getValue();
    var threads = apex.item("P1_THREADS").getValue();
    var fileType = apex.item("P1_FILETYPE").getValue();
    var fileID;
    if ( fileType == 'local' ) {
        fileID = "P1_FILE";
    }
    if ( fileType == 'remote' ) {
        fileID = "P1_URL";
    }
    options.chunkSize = chunkSize;
    options.threads = threads;
    options.fileType = fileType;
    options.fileID = fileID;
}
```


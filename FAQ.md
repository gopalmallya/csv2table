**Why use csv2table?**

Uploading large csv datasets (100mb-1gb+) from APEX application can take hours to upload, parse and insert into table, csv2table plugin solves this problem, makes it a lot (10x) faster. 

Note - I have uploaded 1.5GB of csv file without exhausting browser memory under 11 minutes in free oracle cloud VM environment, which comes to ~ 2mb/sec. I believe in production environment, once can upload 1GB csv file under 1 minute by tuning chunkSize and Threads. Please read FAQ for more information. 

**can I use csv2table with oracle 11g and APEX 5.x ?**

Yes, the plugin can be configured to use any plsql data parser like json_table, APEX_DATA_PARSER, xmltable and custom insert implementation, making it possible to be used in any database and APEX version. 

Version 1.0 was developed on 11.2.0.0/APEX 5.1.4 and tested on database 19.0 and APEX version 20.2. 

**can I insert records into other schema than APEX parsing schema?**

Yes, plugin code will execute insert against csv2table (table) using dynamic sql. You will have to create table synonym and give insert grants to APEX parsing schema.
You can also choose custom insert implementation to insert in any schema or table per your environment and requirements

**Why is csv2table plugin fast?**

csv2table parses records from local files in Javascript memory in chunks (JSON) using fast csv parser (PapaParse), keeping memory usage low and inserting parsed chunks using json_table function, which is very also very fast. 

**How do I know, when the file is fully uploaded and all records are inserted into csv2table?**

Complete callback function is only called, when csv2table is done processing the files. You can the check the result object for "complete" status, and take further actions

```js
function completeFn(results){
    console.log("I am error complete callback function", results);

    if ( results.status.state == "complete" ) {
        console.log('Upload completed');
    }
   
}

```

**How do I catch any exceptions?**

Error callback function will be called for any parsing and insert errors. You can check the result object for "error" status and take further actions.

```js
function errorFn(results){
    console.log("I am error callback function", results);

    if ( results.status.state == "error" ) {
        console.log('error message', results.error.message);
    }
   
}

```

**How can I track upload progress?**

After every chunk is inserted, chunk insert callback function is called. The result argument contains the progress value between 0..1

```js
function chunkInsertedFn(results){
    console.log("I am chunk Inserted callback function", results);

    console.log(results.progressSoFar());
   
}

```

**Does the plugin support multiple files?**

No. Multiple file feature is work under progress for future version.

**can I uplooad tab delimited or color delimited file?**

Yes, delimiters are auto detected by PapaParse csv parser.

you can also set the delimiter in the Javascript Initiliazation option.

Below Javascript initialization function, sets the plugin options during run time
```js
function (options) {
    options.delimiter = ":" ;//colon delimiter
    options.newline = "\n"  ; //newline separating records
    options.quoteChar = "'";  //char used for quoting columns
    options.escapeChar = "\\";  //char used for escaping quoteChar
    options.chunkSize = "1000000";
    options.threads = 2;
    options.fileType = "remote";
    options.skipFirstNRows = "1"
}

```
For more details please refer to PapaPare documentation on csv parser [ configuration ](https://www.papaparse.com/docs#config)

**How can I map file columns to csv2table columns?**

Column n is mapped to csvtable.cn , for e.g 1st column of records will be inserted into csvtable.c1

**How do I validate column format (e.g. Date) and any business validation on columns or set of rows?**

After upload is completed, all records are available in csv2table, having same upload Identifier in csv2table.upload_ID, which can be used to query records and perform any column or row based validations. 

```js
function completeFn(results){
    console.log("I am error complete callback function", results);

    if ( results.status.state == "complete" ) {
        console.log('Upload completed upload_ID: ', results.uploadID());

        //use results.uploadID() to get the upload_ID
        //perform call ajax or submit page to execute
        // validations using upload_ID
    }
   
}

```

Note : Upload_ID is also available in error and chunk inserted callback function

**can I pause the file parsing during upload?**

Yes, you can only pause the parser for stream based upload, i.e when stream option is set to 'Y'

In chunk inserted callback, you can set the pause and resume.

```js

function chunkInsertedFn(results){
    console.log("I am chunk Inserted callback function", results);

    if ( csv2table ) { //csv2table is global object available during upload process and can be access in callbacks
        csv2table.pause();
    }

    //do something like column format validation or some backend processing when upload is paused

    if ( csv2table ) {
        csv2table.resume()
    }
   
}

```

**How can I identify the row containing column header in csv2table after upload is completed?**

If inserts are done parallelly, by setting threads options > 1, then so rows are not inserted in order and you will have to query the csv2table with name of header column to identify the header record

```sql
select * from csv2table where c1='name of first column header'

```
**are blank lines skipped?**

Yes

**can my file contain record where some columns are quoted and some are not?**

Yes and No.

for e.g below is csv file

"Hello",World

Welcome,"Back"

"Thank","You"

No, Problem

?** 

No, but I have found that, PapaParse has bug in parsing mixed quoted and unquoted columns in a record, when stream is set to Y.

Yes, You can use it without issues, by setting chunksize greater than filesize. 
for e.g if your file size is within 5mb, then set the chunkSize to 10mb for files , which may have mixed quoted and unquoted columns.

**does csv2table clean itself by deleting old records periodically?**

No, you can write a archiver and schedule it for cleanups.

**How do I validate upload file has expected number of columns?**

In chunk Inserted callback function, you can get the number of columns, using the result object. Below example checks , prints number of column for first chunk.

```js
function chunkInsertedFn(results){
    console.log("I am chunk Inserted callback function", results);

    //check the number of columns in first chunk
    if ( results.chunked == 1 ) {
        console.log(results.parseResults.data[0].length);

        //here you can also check if the column header (if any) passes expected name and position.
    }
    
}

```

parseResults object can also be used to validate column format and notify the user.

**Why write custom insert implemetation and why bind out variable containing number of inserted records?**

- You may want to perform business validations before the chunk is inserted 
- Or insert chunks into custom table 
- or insert into external table to query, save, process and archive the file
- or you found a faster way to parse the chunk in plsql
- The out bind variable containing record inserted count, is used to track the progress by updating the result object (insertedRowCount())

**can I transform the record before inserting into csv2table?**

You can use the transform option, by setting the options in Javascript Initialization code. Please check PapaParse documentation for more csv parser configuration.

**can I map the csv file column header name with csv2table columns?**

No. csv2table will parse and insert into table using position of column in the uploaded file. 1st column goes into csv2table.c1, 2nd into csvtable.c2
If csv file contains header it will also be inserted. You can configure skip option and set to 1, to skip the first header record.

Other main reason, csv2table is position based, than header-column map based, is because, the size of parsed record in JSON increases with header-column mapping. Every column (value) is mapped to header (key) for every record. This results in size increase and slower performance, than sending just array of column value, which is second fastest way. First is binary. 

I will add header-column mapping in future release, to support this usecase. For now the workaround will be to insert the column header (skip=0) and write a mapper in dynamic plsql using the header name and csv2table.c1...cn 









**Why use csv2table?**

Uploading large csv datasets from apex application takes time, csv2table makes it a lot faster.

**can I use csv2table with oracle 11g and Apex 4.2 ?**

Yes, the plugin can be configured to use any plsql data parser like json_table, apex_data_parser, xmltable and custom insert implementation, making it possible to be used in any database and apex version. 

This beta version 1.0 is developed and tested in Oracle DB 19c/ Apex 20.2

**can I insert records into other schema than apex parsing schema?**

Yes, plugin code will execute insert against csv2table (table) using dynamic sql. You will have to create table synonym and give insert grants to apex parsing schema.
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

    //do something when upload is paused

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




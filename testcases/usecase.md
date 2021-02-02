# Usecases
List  of usecases to test csv2table works

```plsql
for rec in ( select 1 from dual where
              where fileType in (local, Remote)
              and Stream in (Yes, No)
              and insertType in ( json_table, apex_data_parser, xmltable, custom insert)   
)

```
> run below tests

|Testcase|Expected Results|
|---|---|
| SkipFirstNRows = 0| InsertRowcount = FileRowcount |
| SkipFirstNRows > 0| InsertRowcount = FileRowcount |
| chunkSize < FileSize| InsertRowcount = FileRowcount |
| chunkSize > FileSize| InsertRowcount = FileRowcount |
| Threads = 1| InsertRowcount = FileRowcount |
| Threads > 1| InsertRowcount = FileRowcount |
| chunkFormat = JSON| InsertRowcount = FileRowcount |
| chunkFormat = csv| InsertRowcount = FileRowcount |
| chunkFormat = xml| InsertRowcount = FileRowcount |
| Chunk callback fn| InsertRowcount < FileRowcount |
| Error callback fn| called once for error in parsing and insert, program execution stops, upload ID is returned, Status=Error |
| Complete callback fn| upload ID is returned, status=Complete, progressSoFar = 1 |
| Single File| InsertRowcount = FileRowcount |
| Multiple Files| InsertRowcount = FileRowcount and progressSoFar = 1 for complete and < 1 for error |
| File is malformed| error callback, progresssoFar < 1 |
| File has all column in quotes| InsertRowcount = FileRowcount |
| File has mixed quoted and unquoted cols| InsertRowcount = FileRowcount |
| File is not csv| error callback |
| File is 100mb, only with stream=yes| InsertRowcount = FileRowcount |
| File is 1GB, only with stream=yes| InsertRowcount = FileRowcount |
| Parser Pause, only with stream=yes, 100mb file| parser is paused |
| Parser Resume, only with stream=yes| parser resumes |

# Test data
## File with size 10kb, 100kb, 1mb, 10mb, 100mb, 1GB



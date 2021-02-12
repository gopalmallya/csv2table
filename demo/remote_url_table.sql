/* 
-This plsql block when executed creates table named, csv2table_demo_remote_url , used to
populate contents of remote url dropdown on demo page
*/

declare
    l_cnt pls_integer :=0;
    l_table_name varchar2(30) := 'CSV2TABLE_DEMO_REMOTE_URL';
    l_create_table_sql varchar2(32767) := 'create table '|| l_table_name ||'
    ( URL varchar2(1000), filesize number)';

begin
    --create table
    select count(1) into l_cnt from all_objects where object_name = l_table_name and object_type='TABLE';
    if l_cnt > 0 then
        execute immediate 'drop table '|| l_table_name;
    end if;
    select count(1) into l_cnt from all_objects where object_name = l_table_name and object_type='TABLE';
    if l_cnt = 0 then
        execute immediate l_create_table_sql;
    end if;
   
exception
 when others then
    dbms_output.put_line('csv2table creation failed ');
    raise;
end;
/

insert into CSV2TABLE_DEMO_REMOTE_URL(url,filesize) values ('https://gopalmallya.com/csv/move_to_canada.csv',10764);
insert into CSV2TABLE_DEMO_REMOTE_URL(url,filesize) values ('https://gopalmallya.com/csv/job-automation-probability.csv',108150); 
insert into CSV2TABLE_DEMO_REMOTE_URL(url,filesize) values ('https://gopalmallya.com/csv/US-shooting-incidents.csv',1334713);  
insert into CSV2TABLE_DEMO_REMOTE_URL(url,filesize) values ('https://gopalmallya.com/csv/uber-rides-data1.csv',58604196);  
insert into CSV2TABLE_DEMO_REMOTE_URL(url,filesize) values ('https://gopalmallya.com/csv/credit_line.csv.csv',90470092);  
commit;
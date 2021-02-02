/* @license
csv2table
v1.0.0
https://github.com/gopalmallya/apex/tree/main/csv2table
License: MIT
*/
--------------------------------------------------------------------------------
-- this render function sets up a javascript function which will be called
-- when the dynamic action is executed.
-- all relevant configuration settings will be passed to this function as JSON
--------------------------------------------------------------------------------
function render
  ( p_dynamic_action apex_plugin.t_dynamic_action
  , p_plugin         apex_plugin.t_plugin
  )
return apex_plugin.t_dynamic_action_render_result
is
    -- l_result is necessary for the plugin infrastructure
    l_result                   apex_plugin.t_dynamic_action_render_result;
    
    l_ajaxID                  varchar2(4000) := apex_plugin.get_ajax_identifier;
    
    -- read plugin parameters and store in local variables
    l_chunkSize                p_dynamic_action.attribute_01%type := p_dynamic_action.attribute_01;
    l_threads                  p_dynamic_action.attribute_02%type := p_dynamic_action.attribute_02;
    l_fileID                      p_dynamic_action.attribute_03%type := p_dynamic_action.attribute_03;
    l_complete_callback_fn        p_dynamic_action.attribute_05%type := p_dynamic_action.attribute_05;
    l_chunk_inserted_callback_fn  p_dynamic_action.attribute_06%type := p_dynamic_action.attribute_06;
    l_error_callback_fn           p_dynamic_action.attribute_07%type := p_dynamic_action.attribute_07;
    l_chunkFormat                 p_dynamic_action.attribute_11%type := p_dynamic_action.attribute_11; 
    l_insertType                  p_dynamic_action.attribute_08%type := p_dynamic_action.attribute_08;
    l_fileType                    p_dynamic_action.attribute_10%type := p_dynamic_action.attribute_10;
    l_skipFirstNRows              p_dynamic_action.attribute_12%type := p_dynamic_action.attribute_12;
    l_stream                      p_dynamic_action.attribute_13%type := p_dynamic_action.attribute_13;

    -- Javascript Initialization Code
    l_init_js_fn               varchar2(32767) := nvl(apex_plugin_util.replace_substitutions(p_dynamic_action.init_javascript_code), 'undefined');
    
begin
    -- standard debugging intro, but only if necessary
    if apex_application.g_debug
    then
        apex_plugin_util.debug_dynamic_action
          ( p_plugin         => p_plugin
          , p_dynamic_action => p_dynamic_action
          );
    end if;
    
    -- check if we need to add our toastr plugin library files
    apex_javascript.add_library 
      ( p_name           => apex_plugin_util.replace_substitutions('csv2table.js')
      , p_directory      => p_plugin.file_prefix || 'js/'
      , p_skip_extension => true
      );    

    apex_javascript.add_library 
      ( p_name           => apex_plugin_util.replace_substitutions('papaparse.js')
      , p_directory      => p_plugin.file_prefix || 'js/'
      , p_skip_extension => true
      );    


    -- create a JS function call passing all settings as a JSON object
    --
    -- csv2Table(this, {
    --     "ajaxId": "SDtjkD9_TUyDJZzOzlRKnFkZWTFWkOqJrwNuJyUzooI",
    --     "pageItems": {},
    -- });
    apex_json.initialize_clob_output;
    apex_json.open_object;

    apex_json.write('ajaxId'             , l_ajaxID);
    
    apex_json.open_object('pageItems');
    apex_json.write('chunkSize'      , l_chunkSize);
    apex_json.write('threads'      , l_threads);
    apex_json.write('skipFirstNRows'      , l_skipFirstNRows);
    apex_json.write('fileType'      , l_fileType);
    apex_json.write('fileID'      , l_fileID);
    apex_json.write('chunkFormat'      , l_chunkFormat);
    apex_json.write('insertType'      , l_insertType);
    apex_json.write('stream'      , l_stream);
    if l_complete_callback_fn is not null then
      apex_json.write_raw
            ( p_name  => 'complete_callback_fn'
            , p_value => l_complete_callback_fn
            );
    end if;
      
    if l_chunk_inserted_callback_fn is not null then        
      apex_json.write_raw
            ( p_name  => 'chunk_inserted_callback_fn'
            , p_value => l_chunk_inserted_callback_fn
            );          
    end if;

    if l_error_callback_fn is not null then
      apex_json.write_raw
            ( p_name  => 'error_callback_fn'
            , p_value => l_error_callback_fn
            );
    end if;

    apex_json.close_object;

    apex_json.close_object;

    l_result.javascript_function := 'function(){csv2table.upload(this, '|| apex_json.get_clob_output || ', '|| l_init_js_fn ||');}';

    apex_json.free_output;

    -- all done, return l_result now containing the javascript function
    return l_result;
end render;

--------------------------------------------------------------------------------
-- the ajax function is invoked from the csv2table.js, passing 
-- apex_application.g_clob_01 : parsed csv record in configured format (csv, json, xml)
-- apex_application.g_x01 : Filename 
-- apex_application.g_x02 : Upload ID
-- It does 
-- 1.generate upload ID 
-- 2. Inserts records into csv2table using configured insertType
--------------------------------------------------------------------------------
function ajax
  ( p_dynamic_action apex_plugin.t_dynamic_action
  , p_plugin         apex_plugin.t_plugin
  )
return apex_plugin.t_dynamic_action_ajax_result
is
    -- error handling
    l_apex_error       apex_error.t_error;
    l_result           apex_error.t_error_result;
    -- return type which is necessary for the plugin infrastructure
    l_return           apex_plugin.t_dynamic_action_ajax_result;
    
    -- read plugin parameters and store in local variables
    l_insertType        p_dynamic_action.attribute_08%type := p_dynamic_action.attribute_08;
    l_plsql_statement   p_dynamic_action.attribute_09%type := p_dynamic_action.attribute_09; 
    

    l_sid number;
    l_fileID number;
    l_json clob;
    l_message          varchar2(32767);
    l_message_title    varchar2(32767);
    l_insertRowCount   pls_integer;
    l_now varchar2(255);
    l_insert_date date := sysdate;
    l_sql varchar2(32767);
    l_app_session number := :APP_SESSION;
    l_app_user varchar2(255) := :APP_USER;
    l_filename varchar2(255) := apex_application.g_x01;
    l_csv_clob clob;
    l_xml clob;
    l_getUploadID varchar2(255) := apex_application.g_x03;
    l_uploadID number :=  apex_application.g_x02;
begin
    -- standard debugging intro, but only if necessary
    if apex_application.g_debug
    then
        apex_plugin_util.debug_dynamic_action
          ( p_plugin         => p_plugin
          , p_dynamic_action => p_dynamic_action
          );
    end if;
    
    select sys_context('userenv','sid') into l_sid from dual;

    if l_getUploadID = 'getUploadID' then
        select csv2table_seq.nextval into l_uploadID from dual;
            apex_json.initialize_output;
            apex_json.open_object;
            apex_json.write('uploadID' , l_uploadID);
            apex_json.write('status' , 'success');
            apex_json.write('message' , '');
            apex_json.write('insertedRowCount' , 0);
            apex_json.write('fileName' , '');
            apex_json.write('sid' , '');
            apex_json.write('time' , '');
            apex_json.write('messageType', 'getUploadID');
            apex_json.close_object;
            return l_return;
    end if;

    --override option in js init
    if apex_application.g_x04 in ('json','apex_data_parser','plsql','xml') then
       l_insertType := apex_application.g_x04;
    end if;

    if l_insertType = 'plsql' then
       if instr(l_plsql_statement,':ROWCOUNT') > 0 then
          execute immediate l_plsql_statement using out l_insertRowCount;
      else
          execute immediate l_plsql_statement; 
      end if;        
    end if;

    if l_insertType = 'apex_data_parser' then
        l_csv_clob := apex_application.g_clob_01;

        l_sql := 'declare 
                    l_sid number;
                    l_file_id number;
                    l_csv_clob clob;
                    l_csv_blob blob;
                    l_cnt number;
                    FUNCTION clob_to_blob (p_data  IN  CLOB)
                      RETURN BLOB

                    AS
                      l_blob         BLOB;
                      l_dest_offset  PLS_INTEGER := 1;
                      l_src_offset   PLS_INTEGER := 1;
                      l_lang_context PLS_INTEGER := DBMS_LOB.default_lang_ctx;
                      l_warning      PLS_INTEGER := DBMS_LOB.warn_inconvertible_char;
                    BEGIN

                      DBMS_LOB.createtemporary(
                        lob_loc => l_blob,
                        cache   => TRUE);

                      DBMS_LOB.converttoblob(
                      dest_lob      => l_blob,
                      src_clob      => p_data,
                      amount        => DBMS_LOB.lobmaxsize,
                      dest_offset   => l_dest_offset,
                      src_offset    => l_src_offset, 
                      blob_csid     => DBMS_LOB.default_csid,
                      lang_context  => l_lang_context,
                      warning       => l_warning);

                      RETURN l_blob;
                    END;

                    Begin
                    
                    l_csv_blob := clob_to_blob(:l_csv_clob);
                    insert into csv2table ( upload_id, apex_session_id, apex_user, insert_date, filename, 
                      c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,
                      c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,
                      c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,
                      c31,c32,c33,c34,c35,c36,c37,c38,c39,c40,
                      c41,c42,c43,c44,c45,c46,c47,c48,c49,c50,
                      c51,c52,c53,c54,c55,c56,c57,c58,c59,c60,
                      c61,c62,c63,c64,c65,c66,c67,c68,c69,c70,
                      c71,c72,c73,c74,c75,c76,c77,c78,c79,c80,
                      c81,c82,c83,c84,c85,c86,c87,c88,c89,c90,
                      c91,c92,c93,c94,c95,c96,c97,c98,c99,c100
                      )
                      select :upload_id, :APP_SESSION, :APP_ID, :l_insert_date, :l_filename,
                      col001,col002,col003,col004,col005,col006,col007,col008,col009,col010,
                      col011,col012,col013,col014,col015,col016,col017,col018,col019,col020,
                      col021,col022,col023,col024,col025,col026,col027,col028,col029,col030,
                      col031,col032,col033,col034,col035,col036,col037,col038,col039,col040,
                      col041,col042,col043,col044,col045,col046,col047,col048,col049,col050,
                      col051,col052,col053,col054,col055,col056,col057,col058,col059,col060,
                      col061,col062,col063,col064,col065,col066,col067,col068,col069,col070,
                      col071,col072,col073,col074,col075,col076,col077,col078,col079,col080,
                      col081,col082,col083,col084,col085,col086,col087,col088,col089,col090,
                      col091,col092,col093,col094,col095,col096,col097,col098,col099,col100
                      from 
                          table( apex_data_parser.parse(
                                      p_content                     => l_csv_blob,
                                      p_file_name                   => :l_filename2 ) ) p
                    ;
                    :rowcount := sql%rowcount;
                    end;
                  ' ;
      execute immediate l_sql using l_csv_clob, l_uploadID, l_app_session, l_app_user,
                                    l_insert_date, l_filename, l_filename
                                    , out l_insertRowCount ;
      

    end if;

    if l_insertType = 'json' then
      l_json := apex_application.g_clob_01;
      l_sql := 
      '
      insert into csv2table ( upload_id, apex_session_id, apex_user, insert_date, filename, 
      c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,
      c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,
      c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,
      c31,c32,c33,c34,c35,c36,c37,c38,c39,c40,
      c41,c42,c43,c44,c45,c46,c47,c48,c49,c50,
      c51,c52,c53,c54,c55,c56,c57,c58,c59,c60,
      c61,c62,c63,c64,c65,c66,c67,c68,c69,c70,
      c71,c72,c73,c74,c75,c76,c77,c78,c79,c80,
      c81,c82,c83,c84,c85,c86,c87,c88,c89,c90,
      c91,c92,c93,c94,c95,c96,c97,c98,c99,c100
      )
      select :upload_id, :APP_SESSION, :APP_ID, :l_insert_date, :l_filename,
      c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,
      c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,
      c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,
      c31,c32,c33,c34,c35,c36,c37,c38,c39,c40,
      c41,c42,c43,c44,c45,c46,c47,c48,c49,c50,
      c51,c52,c53,c54,c55,c56,c57,c58,c59,c60,
      c61,c62,c63,c64,c65,c66,c67,c68,c69,c70,
      c71,c72,c73,c74,c75,c76,c77,c78,c79,c80,
      c81,c82,c83,c84,c85,c86,c87,c88,c89,c90,
      c91,c92,c93,c94,c95,c96,c97,c98,c99,c100
      from json_table (:l_json
      , ''$[*]''
      columns (    
                    c1 varchar2(255) path ''$[0]'' ,
                    c2 varchar2(255) path ''$[1]'' ,
                    c3 varchar2(255) path ''$[2]'' ,
                    c4 varchar2(255) path ''$[3]'' ,
                    c5 varchar2(255) path ''$[4]'' ,
                    c6 varchar2(255) path ''$[5]'' ,
                    c7 varchar2(255) path ''$[6]'' ,
                    c8 varchar2(255) path ''$[7]'' ,
                    c9 varchar2(255) path ''$[8]'' ,
                    c10 varchar2(255) path ''$[9]'' ,
                    c11 varchar2(255) path ''$[10]'' ,
                    c12 varchar2(255) path ''$[11]'' ,
                    c13 varchar2(255) path ''$[12]'' ,
                    c14 varchar2(255) path ''$[13]'' ,
                    c15 varchar2(255) path ''$[14]'' ,
                    c16 varchar2(255) path ''$[15]'' ,
                    c17 varchar2(255) path ''$[16]'' ,
                    c18 varchar2(255) path ''$[17]'' ,
                    c19 varchar2(255) path ''$[18]'' ,
                    c20 varchar2(255) path ''$[19]'' ,
                    c21 varchar2(255) path ''$[20]'' ,
                    c22 varchar2(255) path ''$[21]'' ,
                    c23 varchar2(255) path ''$[22]'' ,
                    c24 varchar2(255) path ''$[23]'' ,
                    c25 varchar2(255) path ''$[24]'' ,
                    c26 varchar2(255) path ''$[25]'' ,
                    c27 varchar2(255) path ''$[26]'' ,
                    c28 varchar2(255) path ''$[27]'' ,
                    c29 varchar2(255) path ''$[28]'' ,
                    c30 varchar2(255) path ''$[29]'' ,
                    c31 varchar2(255) path ''$[30]'' ,
                    c32 varchar2(255) path ''$[31]'' ,
                    c33 varchar2(255) path ''$[32]'' ,
                    c34 varchar2(255) path ''$[33]'' ,
                    c35 varchar2(255) path ''$[34]'' ,
                    c36 varchar2(255) path ''$[35]'' ,
                    c37 varchar2(255) path ''$[36]'' ,
                    c38 varchar2(255) path ''$[37]'' ,
                    c39 varchar2(255) path ''$[38]'' ,
                    c40 varchar2(255) path ''$[39]'' ,
                    c41 varchar2(255) path ''$[40]'' ,
                    c42 varchar2(255) path ''$[41]'' ,
                    c43 varchar2(255) path ''$[42]'' ,
                    c44 varchar2(255) path ''$[43]'' ,
                    c45 varchar2(255) path ''$[44]'' ,
                    c46 varchar2(255) path ''$[45]'' ,
                    c47 varchar2(255) path ''$[46]'' ,
                    c48 varchar2(255) path ''$[47]'' ,
                    c49 varchar2(255) path ''$[48]'' ,
                    c50 varchar2(255) path ''$[49]'' ,
                    c51 varchar2(255) path ''$[50]'' ,
                    c52 varchar2(255) path ''$[51]'' ,
                    c53 varchar2(255) path ''$[52]'' ,
                    c54 varchar2(255) path ''$[53]'' ,
                    c55 varchar2(255) path ''$[54]'' ,
                    c56 varchar2(255) path ''$[55]'' ,
                    c57 varchar2(255) path ''$[56]'' ,
                    c58 varchar2(255) path ''$[57]'' ,
                    c59 varchar2(255) path ''$[58]'' ,
                    c60 varchar2(255) path ''$[59]'' ,
                    c61 varchar2(255) path ''$[60]'' ,
                    c62 varchar2(255) path ''$[61]'' ,
                    c63 varchar2(255) path ''$[62]'' ,
                    c64 varchar2(255) path ''$[63]'' ,
                    c65 varchar2(255) path ''$[64]'' ,
                    c66 varchar2(255) path ''$[65]'' ,
                    c67 varchar2(255) path ''$[66]'' ,
                    c68 varchar2(255) path ''$[67]'' ,
                    c69 varchar2(255) path ''$[68]'' ,
                    c70 varchar2(255) path ''$[69]'' ,
                    c71 varchar2(255) path ''$[70]'' ,
                    c72 varchar2(255) path ''$[71]'' ,
                    c73 varchar2(255) path ''$[72]'' ,
                    c74 varchar2(255) path ''$[73]'' ,
                    c75 varchar2(255) path ''$[74]'' ,
                    c76 varchar2(255) path ''$[75]'' ,
                    c77 varchar2(255) path ''$[76]'' ,
                    c78 varchar2(255) path ''$[77]'' ,
                    c79 varchar2(255) path ''$[78]'' ,
                    c80 varchar2(255) path ''$[79]'' ,
                    c81 varchar2(255) path ''$[80]'' ,
                    c82 varchar2(255) path ''$[81]'' ,
                    c83 varchar2(255) path ''$[82]'' ,
                    c84 varchar2(255) path ''$[83]'' ,
                    c85 varchar2(255) path ''$[84]'' ,
                    c86 varchar2(255) path ''$[85]'' ,
                    c87 varchar2(255) path ''$[86]'' ,
                    c88 varchar2(255) path ''$[87]'' ,
                    c89 varchar2(255) path ''$[88]'' ,
                    c90 varchar2(255) path ''$[89]'' ,
                    c91 varchar2(255) path ''$[90]'' ,
                    c92 varchar2(255) path ''$[91]'' ,
                    c93 varchar2(255) path ''$[92]'' ,
                    c94 varchar2(255) path ''$[93]'' ,
                    c95 varchar2(255) path ''$[94]'' ,
                    c96 varchar2(255) path ''$[95]'' ,
                    c97 varchar2(255) path ''$[96]'' ,
                    c98 varchar2(255) path ''$[97]'' ,
                    c99 varchar2(255) path ''$[98]'' ,
                    c100 varchar2(255) path ''$[99]'' 
                )
      )';
      execute immediate l_sql using l_uploadID, l_app_session, l_app_user,
                                    l_insert_date, l_filename, l_json;
      l_insertRowCount := sql%rowcount;                              
      
    end if;

    if l_insertType = 'xml' then
           l_xml := apex_application.g_clob_01;
           l_sql := '
          insert into csv2table ( upload_id, apex_session_id, apex_user, insert_date, filename, 
          c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,
          c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,
          c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,
          c31,c32,c33,c34,c35,c36,c37,c38,c39,c40,
          c41,c42,c43,c44,c45,c46,c47,c48,c49,c50,
          c51,c52,c53,c54,c55,c56,c57,c58,c59,c60,
          c61,c62,c63,c64,c65,c66,c67,c68,c69,c70,
          c71,c72,c73,c74,c75,c76,c77,c78,c79,c80,
          c81,c82,c83,c84,c85,c86,c87,c88,c89,c90,
          c91,c92,c93,c94,c95,c96,c97,c98,c99,c100
          )
          with x as ( select :l_xml as xml_text from dual)
          select :upload_id, :APP_SESSION, :APP_ID, :l_insert_date, :l_filename,
          c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,
          c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,
          c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,
          c31,c32,c33,c34,c35,c36,c37,c38,c39,c40,
          c41,c42,c43,c44,c45,c46,c47,c48,c49,c50,
          c51,c52,c53,c54,c55,c56,c57,c58,c59,c60,
          c61,c62,c63,c64,c65,c66,c67,c68,c69,c70,
          c71,c72,c73,c74,c75,c76,c77,c78,c79,c80,
          c81,c82,c83,c84,c85,c86,c87,c88,c89,c90,
          c91,c92,c93,c94,c95,c96,c97,c98,c99,c100
          from  x, xmltable(
          ''/xd/r''
          passing xmltype(x.xml_text)
          columns     
                      c1 varchar2(255) path ''c0'' ,
                      c2 varchar2(255) path ''c1'' ,
                      c3 varchar2(255) path ''c2'' ,
                      c4 varchar2(255) path ''c3'' ,
                      c5 varchar2(255) path ''c4'' ,
                      c6 varchar2(255) path ''c5'' ,
                      c7 varchar2(255) path ''c6'' ,
                      c8 varchar2(255) path ''c7'' ,
                      c9 varchar2(255) path ''c8'' ,
                      c10 varchar2(255) path ''c9'' ,
                      c11 varchar2(255) path ''c10'' ,
                      c12 varchar2(255) path ''c11'' ,
                      c13 varchar2(255) path ''c12'' ,
                      c14 varchar2(255) path ''c13'' ,
                      c15 varchar2(255) path ''c14'' ,
                      c16 varchar2(255) path ''c15'' ,
                      c17 varchar2(255) path ''c16'' ,
                      c18 varchar2(255) path ''c17'' ,
                      c19 varchar2(255) path ''c18'' ,
                      c20 varchar2(255) path ''c19'' ,
                      c21 varchar2(255) path ''c20'' ,
                      c22 varchar2(255) path ''c21'' ,
                      c23 varchar2(255) path ''c22'' ,
                      c24 varchar2(255) path ''c23'' ,
                      c25 varchar2(255) path ''c24'' ,
                      c26 varchar2(255) path ''c25'' ,
                      c27 varchar2(255) path ''c26'' ,
                      c28 varchar2(255) path ''c27'' ,
                      c29 varchar2(255) path ''c28'' ,
                      c30 varchar2(255) path ''c29'' ,
                      c31 varchar2(255) path ''c30'' ,
                      c32 varchar2(255) path ''c31'' ,
                      c33 varchar2(255) path ''c32'' ,
                      c34 varchar2(255) path ''c33'' ,
                      c35 varchar2(255) path ''c34'' ,
                      c36 varchar2(255) path ''c35'' ,
                      c37 varchar2(255) path ''c36'' ,
                      c38 varchar2(255) path ''c37'' ,
                      c39 varchar2(255) path ''c38'' ,
                      c40 varchar2(255) path ''c39'' ,
                      c41 varchar2(255) path ''c40'' ,
                      c42 varchar2(255) path ''c41'' ,
                      c43 varchar2(255) path ''c42'' ,
                      c44 varchar2(255) path ''c43'' ,
                      c45 varchar2(255) path ''c44'' ,
                      c46 varchar2(255) path ''c45'' ,
                      c47 varchar2(255) path ''c46'' ,
                      c48 varchar2(255) path ''c47'' ,
                      c49 varchar2(255) path ''c48'' ,
                      c50 varchar2(255) path ''c49'' ,
                      c51 varchar2(255) path ''c50'' ,
                      c52 varchar2(255) path ''c51'' ,
                      c53 varchar2(255) path ''c52'' ,
                      c54 varchar2(255) path ''c53'' ,
                      c55 varchar2(255) path ''c54'' ,
                      c56 varchar2(255) path ''c55'' ,
                      c57 varchar2(255) path ''c56'' ,
                      c58 varchar2(255) path ''c57'' ,
                      c59 varchar2(255) path ''c58'' ,
                      c60 varchar2(255) path ''c59'' ,
                      c61 varchar2(255) path ''c60'' ,
                      c62 varchar2(255) path ''c61'' ,
                      c63 varchar2(255) path ''c62'' ,
                      c64 varchar2(255) path ''c63'' ,
                      c65 varchar2(255) path ''c64'' ,
                      c66 varchar2(255) path ''c65'' ,
                      c67 varchar2(255) path ''c66'' ,
                      c68 varchar2(255) path ''c67'' ,
                      c69 varchar2(255) path ''c68'' ,
                      c70 varchar2(255) path ''c69'' ,
                      c71 varchar2(255) path ''c70'' ,
                      c72 varchar2(255) path ''c71'' ,
                      c73 varchar2(255) path ''c72'' ,
                      c74 varchar2(255) path ''c73'' ,
                      c75 varchar2(255) path ''c74'' ,
                      c76 varchar2(255) path ''c75'' ,
                      c77 varchar2(255) path ''c76'' ,
                      c78 varchar2(255) path ''c77'' ,
                      c79 varchar2(255) path ''c78'' ,
                      c80 varchar2(255) path ''c79'' ,
                      c81 varchar2(255) path ''c80'' ,
                      c82 varchar2(255) path ''c81'' ,
                      c83 varchar2(255) path ''c82'' ,
                      c84 varchar2(255) path ''c83'' ,
                      c85 varchar2(255) path ''c84'' ,
                      c86 varchar2(255) path ''c85'' ,
                      c87 varchar2(255) path ''c86'' ,
                      c88 varchar2(255) path ''c87'' ,
                      c89 varchar2(255) path ''c88'' ,
                      c90 varchar2(255) path ''c89'' ,
                      c91 varchar2(255) path ''c90'' ,
                      c92 varchar2(255) path ''c91'' ,
                      c93 varchar2(255) path ''c92'' ,
                      c94 varchar2(255) path ''c93'' ,
                      c95 varchar2(255) path ''c94'' ,
                      c96 varchar2(255) path ''c95'' ,
                      c97 varchar2(255) path ''c96'' ,
                      c98 varchar2(255) path ''c97'' ,
                      c99 varchar2(255) path ''c98'' ,
                      c100 varchar2(255) path ''c99''                     

          )';
      execute immediate l_sql using l_xml, l_uploadID, l_app_session, l_app_user, l_insert_date, l_filename ;          
      l_insertRowCount := sql%rowcount;
    end if;

    
    l_now := to_char(sysdate, 'hh24:mi:ss');
    l_message := ' inserted '||l_insertRowCount||' csv records: ' || APEX_APPLICATION.G_X01||' *sid* '|| l_sid|| ' time: '|| to_char(sysdate, 'hh24:mi:ss');
    htp.p(l_message);
  
    apex_json.initialize_output;
    apex_json.open_object;
    apex_json.write('uploadID' , l_uploadID);
    apex_json.write('status' , 'success');
    apex_json.write('message' , l_message);
    apex_json.write('insertedRowCount' , l_insertRowCount);
    apex_json.write('fileName' , APEX_APPLICATION.G_X01);
    apex_json.write('sid' , l_sid);
    apex_json.write('time' , l_now);
    apex_json.write('messageType', 'insert');
    
    apex_json.close_object;

    return l_return;
exception
    when others then
        rollback;

        l_message := apex_escape.html(sqlerrm);
        
        apex_json.initialize_output;
        apex_json.open_object;
        apex_json.write('status' , 'error');
        apex_json.write('sqlerrm' , l_message);
        apex_json.write('sqlcode' , sqlcode);
        apex_json.write('message', 'Error inserting parsed records into table');
        
        apex_json.close_object;

        return l_return;    
end ajax;
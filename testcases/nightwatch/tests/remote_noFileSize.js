module.exports = {
  'Demo test csv2table remote' : function(browser) {
    let uploadPage = browser.page.upload();
//**********************************************Stream Yes********************************* */
    // remote, chunksize 1kb < filesize 10kb, threads 1, skip 0, stream yes, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024","1000","1","0","Y","apex_data_parser","10000")

   // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream yes, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024000","1000","1","1","Y","apex_data_parser","10000")

    // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024","1000","2","1","Y","apex_data_parser","10000")

   // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024000","1000","2","0","Y","apex_data_parser","10000")

      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","1","0","Y","json","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream yes, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","1","1","Y","json","10000")

      // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","2","1","Y","json","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","2","0","Y","json","10000")

      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","1","0","Y","xml","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream yes, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","1","1","Y","xml","10000")

      // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","2","1","Y","xml","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream yes, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","2","0","Y","xml","10000")

//*********************************************stream NO*********************************//

    // remote, chunksize 1kb < filesize 10kb, threads 1, skip 0, stream no, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024","1000","1","0","N","apex_data_parser","10000")

   // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream no, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024000","1000","1","1","N","apex_data_parser","10000")

    // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024","1000","2","1","N","apex_data_parser","10000")

   // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType apex_data_parser
    uploadPage
    .navigate()  
    .remote("Home","remote",
    "https:\/\/gopalmallya.com\/csv\/titanic.csv",
    "1024000","1000","2","0","N","apex_data_parser","10000")

      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","1","0","N","json","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream no, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","1","1","N","json","10000")

      // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","2","1","N","json","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType json
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","2","0","N","json","10000")

      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","1","0","N","xml","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 1, skip 1, stream no, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","1","1","N","xml","10000")

      // remote, chunksize 1kb < filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024","1000","2","1","N","xml","10000")

      // remote, chunksize 1mb > filesize 10kb, threads 2, skip 1, stream no, pause 1000, insertType xml
      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv",
      "1024000","1000","2","0","N","xml","10000")


  }
};


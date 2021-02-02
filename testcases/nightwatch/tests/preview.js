module.exports = {
  'Demo test csv2table local' : function(browser) {
    let uploadPage = browser.page.upload();
//**********************************************Stream Yes********************************* */
    // local, chunksize 1kb < filesize 10kb, threads 1, skip 0, stream yes, pause 1000, insertType apex_data_parser

      uploadPage
      .navigate()  
      .local("Home","local",
      "C:\\Users\\gopal_mallya\\Documents\\csv_upload_plugin\\datasets-master\\auto-mpg.csv",
      "1024000","1000","1","0","Y","json","10000")
      .saveScreenshot('./local.png')

      uploadPage
      .navigate()  
      .remote("Home","remote",
      "https:\/\/gopalmallya.com\/csv\/titanic.csv,10909",
      "1024","1000","2","1","N","apex_data_parser","10000")
      .saveScreenshot('./remote.png')


  }
};


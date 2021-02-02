module.exports = {
    "P9_FILETYPE_1":"remote",
    "P9_THREADS":"3",

    'Demo test csv2table remote' : function(browser) {
      browser
        .url('https://gopalmallya.com/ords/r/gopalmallya/csv2table')
        .waitForElementVisible('body')
        .assert.titleContains('Home')
        .assert.visible('#P9_FILETYPE')
        .assert.visible('#P9_FILETYPE_1')
        .click('label[For="P9_FILETYPE_1"]')
        .setValue('#P9_FILETYPE_1', this.P9_FILETYPE_1)
        .setValue('#P9_URL', 'https:\/\/gopalmallya.com\/csv\/auto-mpg.csv,10118')
        .click('#P9_CHUNKSIZE')
        .pause(1000)
        .click('option[value="1024"]')
        .setValue('#P9_THREADS',this.P9_THREADS)
        .setValue('#P9_SKIPFIRSTNROWS','1')
        .click('.a-Switch-toggle')
        .setValue('#P9_STREAM',"Y")
        .assert.visible('button[id=submit]')
        .click('button[id=submit]')
        .pause(10000)
        .assert.containsText('.progressBarPCT', '100%') 
        .end()
    }
  };


require('file?name=manifest.[ext]!../manifest.json')


const extensionOptionsDefaultValues = {
  isFirstRun: true,
  runOnBaiduSearch: true,
  runOnDuckduckgoSearch: true,
  runOnBingSearch: true,
  runOnGoogleSearch: true,
  extensionToken: ''
}

/*****
* Using chrome.storage.local rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on) 
*/

chrome.runtime.onInstalled.addListener(({reason}) => {
  if(reason !== 'install'){
    return
  }
  chrome.storage.local.get('isFirstRun', ({isFirstRun}) => {
    /*****
    * If isFirstRun is undefined, it is most likely the first run
    * of the extension.
    */
    if(typeof isFirstRun === 'undefined'){
      console.log('First Run')
      /*****
      * Set the default values for extension options
      */
      chrome.storage.local.set(
        extensionOptionsDefaultValues,
        () => {
          /*****
          * We set the chrome.storage.local value for isFirstRun to false
          * in the options page js on first run.
          */
          chrome.runtime.openOptionsPage()
        }
      )
    }
  })
})

require('file?name=manifest.[ext]!../manifest.json')

import got from 'got'

const extensionOptionsDefaultValues = {
  isFirstRun: true,
  runOnBaiduSearch: true,
  runOnDuckduckgoSearch: true,
  runOnBingSearch: true,
  runOnGoogleSearch: true,
  extensionToken: ''
}
let marksearchServerAddress = null
let marksearchApiToken = null
let urlThatWasLastChecked = null


/*****
* Check if the web page is saved in MarkSearch
*/
function checkIfPageIsSaved(){
  console.log('checkIfPageIsSaved 1')

  if(!marksearchServerAddress || !marksearchApiToken){
    return
  }
  console.log('checkIfPageIsSaved 2')
  console.log(marksearchApiToken)
  console.log(marksearchServerAddress)
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
      windowType: 'normal'
    },
    tabs => {
      if(!tabs[0] || !tabs[0].url){
        return
      }
      const currentTab = tabs[0]
      const currentUrl = currentTab.url
      console.log('urlThatWasLastChecked', urlThatWasLastChecked)
      if(currentUrl === urlThatWasLastChecked){
        return
      }
      console.log('chrome.tabs.query callback')
      /* eslint-disable */
      got
        .post(
          marksearchServerAddress,
          {
            headers: {
              Authorization: marksearchApiToken
            }
          }
        )
        .then(response => {
          console.log('got.post success')
          urlThatWasLastChecked = currentUrl
          console.log(response.body)
        })
        .catch(error => {
          console.log('got.post error')
          console.error(error)
        })
        /* eslint-enable */
    }
  )
}

checkIfPageIsSaved()

/*****
* Event listeners
*/

chrome.runtime.onInstalled.addListener(({reason}) => {
  if(reason !== 'install'){
    return
  }
  /*****
  * Using chrome.storage.local rather than storage.sync in case they have MarkSearch
  * set up on a different network and have different settings there (e.g. different
  * port number that MarkSearch is running on)
  */
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
          * Once the options page has loaded for the first time, the options.js then sets the
          * chrome.storage.local value for isFirstRun to false.
          */
          chrome.runtime.openOptionsPage()
        }
      )
    }
  })
})

chrome.tabs.onActivated.addListener(checkIfPageIsSaved)

chrome.tabs.onUpdated.addListener((tabId, {status}) => {
  /*****
  * Start it early so by the time its loaded we've hopefully already got the response from
  * the MarkSearch searver.
  */
  if(status === 'loading'){
    checkIfPageIsSaved()
  }
})

chrome.windows.onFocusChanged.addListener(checkIfPageIsSaved)

/*****
* If user changes the token, update the reference for server address and server api token
*/
chrome.storage.onChanged.addListener((changedOptions, storageAreaName) => {
  if(storageAreaName === 'local' &&
    changedOptions.extensionToken &&
    changedOptions.extensionToken.includes(',')
  ){
    const splitExtensionToken = changedOptions.extensionToken.split(',')
    marksearchServerAddress = splitExtensionToken[0]
    marksearchApiToken = splitExtensionToken[1]
  }
})

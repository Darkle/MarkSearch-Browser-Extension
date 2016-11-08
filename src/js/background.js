require('file?name=manifest.[ext]!../manifest.json')

import got from 'got'

const extensionOptionsDefaultValues = {
  integrateWithBaiduSearch: true,
  integrateWithDuckduckgoSearch: true,
  integrateWithBingSearch: true,
  integrateWithGoogleSearch: true,
  extensionToken: ''
}
let marksearchServerAddress = null
let marksearchApiToken = null
let urlThatWasLastChecked = null

function assignServerAddressAndToken(extensionTokenString){
  if(typeof extensionTokenString === 'string' && extensionTokenString.indexOf(',') > 1){
    const splitExtensionToken = extensionTokenString.split(',')
    marksearchServerAddress = splitExtensionToken[0]
    marksearchApiToken = splitExtensionToken[1]
  }
}

/*****
* This assigns the marksearchApiToken & marksearchServerAddress values on chrome startup.
*
* Using chrome.storage.local rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/
chrome.storage.local.get(null, ({extensionToken}) => assignServerAddressAndToken) // eslint-disable-line no-unused-vars

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
      if(currentUrl === urlThatWasLastChecked || !/^(http|https):\/\//.test(currentUrl)){
        return
      }
      console.log('chrome.tabs.query callback')
      /* eslint-disable */
      // got
      //   .post(
      //     marksearchServerAddress + '/api/get/' + encodeURIComponent(currentUrl),
      //     {
      //       headers: {
      //         Authorization: marksearchApiToken
      //       }
      //     }
      //   )
      //   .then(response => {
      //     console.log('got.post success')
      //     urlThatWasLastChecked = currentUrl
      //     console.log(response.body)
      //   })
      //   .catch(error => {
      //     console.log('got.post error')
      //     console.error(error)
      //   })
        // got('http://127.0.0.1', {port: 8080})
        // // got('http://www.bom.gov.au/products/IDR023.loop.shtml#skip')
        //   .then(response => {
        //     console.log('got.post success')
        //     urlThatWasLastChecked = currentUrl
        //     console.log(response.body)
        //   })
        //   .catch(error => {
        //     console.log('got.post error')
        //     console.error(error)
        //   })
        fetch('http://127.0.0.1:8080', {
          method: 'get'
        }).then(function(response) {
            console.log('fetch success')
            console.log(response)
        }).catch(function(err) {
          console.log('fetch success')
          console.error(err)
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
  if(reason === 'install'){
    chrome.storage.local.get(null, options => {
      if(!options.extensionToken){
        /*****
        * Set up the default settings on first install.
        */
        chrome.storage.local.set(
          extensionOptionsDefaultValues,
          () => {
            chrome.runtime.openOptionsPage()
          }
        )
      }
    })
  }
})

chrome.tabs.onActivated.addListener(checkIfPageIsSaved)

chrome.tabs.onUpdated.addListener((tabId, {status}) => {
  /*****
  * Start it early so by the time its loaded we have (hopefully) received a response from
  * the MarkSearch server and the icon has been changed to reflect its status as saved/not saved.
  */
  if(status === 'loading'){
    checkIfPageIsSaved()
  }
})

chrome.windows.onFocusChanged.addListener(checkIfPageIsSaved)

/*****
* If user changes the token, update the reference for server address and server api token
*/
chrome.storage.onChanged.addListener(({extensionToken}, storageAreaName) => {
  if(storageAreaName === 'local' && extensionToken){
    assignServerAddressAndToken(extensionToken.newValue)
  }
})

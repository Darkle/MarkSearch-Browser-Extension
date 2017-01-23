import { generateMSserverSearchUrl } from './contentScripts/CS_utils'

function setUpOmniboxIntegration(){
  chrome.omnibox.onInputEntered.addListener((searchTerms, OnInputEnteredDisposition) => {
    const msServerSearchUrl = generateMSserverSearchUrl(localStorage.marksearchServerAddress, searchTerms)
    /*****
    * https://developer.chrome.com/extensions/omnibox#type-OnInputEnteredDisposition
    */
    if(OnInputEnteredDisposition === 'currentTab'){
      chrome.tabs.update({url: msServerSearchUrl})
    }
    if(OnInputEnteredDisposition === 'newForegroundTab'){
      chrome.tabs.create({url: msServerSearchUrl, active: true})
    }
    if(OnInputEnteredDisposition === 'newBackgroundTab'){
      chrome.tabs.create({url: msServerSearchUrl, active: false})
    }
  })
}

export {
  setUpOmniboxIntegration
}

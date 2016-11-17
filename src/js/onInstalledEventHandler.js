
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'
import { getSettings } from './utils'

function onInstalledEventHandler({reason}){
  if(reason === 'install'){
    getSettings()
      .then(({extensionToken}) => {
        if(!extensionToken){
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
}

export { onInstalledEventHandler }

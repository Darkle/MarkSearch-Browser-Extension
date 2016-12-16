
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'
import { getSettings } from './utils'

async function onInstalledEventHandler({reason}){
  if(reason === 'install'){
    const {extensionToken} = await getSettings()

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
  }
}

export { onInstalledEventHandler }

import { getSettings, safeGetObjectProperty } from '../utils'

import { isWebUri } from 'valid-url'

const extensionSettings = {}

function createShortcutExtensionSettingsProperties(){
  if(typeof safeGetObjectProperty(extensionSettings, 'extensionToken') !== 'string'){
    return
  }

  const [marksearchServerAddress, marksearchApiToken] = extensionSettings.extensionToken.split(',')

  if(!isWebUri(marksearchServerAddress)){
    return
  }

  Object.assign(
    extensionSettings,
    {
      marksearchServerAddress,
      marksearchApiToken
    }
  )
}

getSettings().then( settings => {
  Object.assign(extensionSettings, settings)
  createShortcutExtensionSettingsProperties(extensionSettings)
})

function getSetting(settingName){
  return extensionSettings[`${ settingName }`]
}

export {
  getSetting
}

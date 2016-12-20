import { getSettings } from '../utils'

const extensionSettings = {}

getSettings().then( settings => {
  Object.assign(extensionSettings, settings)
})

function getSetting(settingName){
  return extensionSettings[`${ settingName }`]
}

export {
  getSetting
}

import { getSettings } from '../utils'

const extensionSettings = {}

getSettings().then( settings => {
  Object.assign(extensionSettings, settings)
})

function getSetting(settingName){
  return extensionSettings[`${ settingName }`]
}

function setMSiconClass(msSidebarIcon, msSidebarIconTop){
  const containsClass = msSidebarIcon.classList.contains('msSidebarIconFixed')
  const winScrollY = window.scrollY

  if(!containsClass && winScrollY >= msSidebarIconTop){
    msSidebarIcon.classList.add('msSidebarIconFixed')
  }
  if(containsClass && winScrollY < msSidebarIconTop){
    msSidebarIcon.classList.remove('msSidebarIconFixed')
  }
}

export {
  getSetting,
  setMSiconClass,
}

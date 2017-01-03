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

function generateMassTempResultsForDev(markSearchResults){
  let tempResults = []
  if(markSearchResults[0]){
    tempResults = Array(100)
                    .fill(markSearchResults[0])
                    .map((item, index) =>
                      Object.assign({}, item, {pageTitle: `${ item.pageTitle } ${ index + 1 }`})
                      // Object.assign(
                      //   {},
                      //   item,
                      //   {
                      //     pageTitle: `${ item.pageTitle } ${ index + 1 }`,
                      //     pageUrl: item.pageUrl.repeat(10)
                      //   }
                      // )
                    )
  }
  return tempResults
}

export {
  getSetting,
  setMSiconClass,
  generateMassTempResultsForDev,
}

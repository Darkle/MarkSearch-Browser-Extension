import { toggleShowMSresultBoxAsTab } from './msResultsBoxForGoogle'

function setUpKeyboardShortcuts(){
  chrome.runtime.onMessage.addListener(({shortcutCommand}) => {
    if(shortcutCommand === 'toggleMarksearchResultsBox'){
      toggleShowMSresultBoxAsTab()
    }
  })
}

export {
  setUpKeyboardShortcuts
}

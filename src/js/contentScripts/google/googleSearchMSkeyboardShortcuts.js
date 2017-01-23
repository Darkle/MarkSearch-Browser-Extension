import { msResultsBoxElem } from './msResultsBoxForGoogle'

function setUpKeyboardShortcuts(){
  chrome.runtime.onMessage.addListener(({shortcutCommand}) => {
    if(shortcutCommand === 'toggleMarksearchResultsBox'){
      msResultsBoxElem.classList.toggle('msResultsBoxShowTabOnly')
    }
  })
}

export {
  setUpKeyboardShortcuts
}

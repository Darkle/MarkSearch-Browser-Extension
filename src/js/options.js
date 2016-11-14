import '../styles/commonStyles.styl'
import '../styles/options.styl'

import { getSettings } from './utils'

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

function firstRunCheck(extensionToken){
  const navListElems = $$('#optionsPanel nav li')
  if(extensionToken.indexOf(',') === -1){
    /*****
    * navListElems[1] is the setup tab - show that if its the first run
    */
    return navListElems[1]
  }
  return navListElems[0]
}

function getOptionElementValue(optionElement){
  if(optionElement.matches('input[type="checkbox"]')){
    return optionElement.checked
  }
  return optionElement.value
}

function saveOptions(DOMoptionElements) {
  console.log('saving options')
  // console.log('saved settingsObj',
  //   Object
  //     .keys(DOMoptionElements)
  //     .reduce((settingsObj, keyname) => {
  //       const optionElement = DOMoptionElements[keyname]
  //       settingsObj[optionElement.dataset.settingKey] = getOptionElementValue(optionElement)
  //       return settingsObj
  //     },
  //     {}
  //   )
  // )
  chrome.storage.local.set(
    Object
      .keys(DOMoptionElements)
      .reduce((settingsObj, keyname) => {
        const optionElement = DOMoptionElements[keyname]
        settingsObj[optionElement.dataset.settingKey] = getOptionElementValue(optionElement)
        return settingsObj
      },
      {}
    )
  )
}

function setInitialDOMoptionValues(options, DOMoptionElements) {
  DOMoptionElements.extTokenInput.value = options.extensionToken
  DOMoptionElements.googleSearchCheckbox.checked = options.integrateWithGoogleSearch
  DOMoptionElements.bingSearchCheckbox.checked = options.integrateWithBingSearch
  DOMoptionElements.duckduckgoSearchCheckbox.checked = options.integrateWithDuckduckgoSearch
  DOMoptionElements.baiduSearchCheckbox.checked = options.integrateWithBaiduSearch
}

function setUpHelpAboutPage() {
  const versionText = `MarkSearch Version: ${ chrome.runtime.getManifest().version }`
  $('#marksearchVersionNumber').innerText = versionText
}

function settingsTabsBehaviour(selectedListElement) {
  /*****
  * const seems to be valid in for of loops - http://bit.ly/2eYKQd1 http://bit.ly/2eYECtO
  */
  for(const liElem of $$('#optionsPanel nav li')){
    const elDataSet = liElem.dataset.showHideDivId
    if(selectedListElement === liElem){
      liElem.className = 'selected'
      $(elDataSet).className = 'show'
    }
    else{
      liElem.className = ''
      $(elDataSet).className = 'hide'
    }
  }
}

function setUpEventListeners(DOMoptionElements) {
  $('#optionsPanel nav').addEventListener('click', evt => settingsTabsBehaviour(evt.target))
  for(const inputElem of $$('input')){
    inputElem.addEventListener('change', () => saveOptions(DOMoptionElements))
  }
  /*****
  * Also need .addEventListener('input' for extTokenInput as $('input').addEventListener('change'
  * only fires for text input change once it loses focus, so using .addEventListener('input' as
  * well so it saves straight away on paste.
  */
  DOMoptionElements.extTokenInput.addEventListener('input', () => saveOptions(DOMoptionElements))
}

function optionsPageInit() {
  const DOMoptionElements = {
    extTokenInput: $('#extensionToken'),
    googleSearchCheckbox: $('#googleSearchCheckbox'),
    bingSearchCheckbox: $('#bingSearchCheckbox'),
    duckduckgoSearchCheckbox: $('#duckduckgoSearchCheckbox'),
    baiduSearchCheckbox: $('#baiduSearchCheckbox'),
  }
  getSettings()
    .then(options => {
      setInitialDOMoptionValues(options, DOMoptionElements)
      settingsTabsBehaviour(firstRunCheck(options.extensionToken))
      setUpHelpAboutPage()
      setUpEventListeners(DOMoptionElements)
    })
}


document.addEventListener('DOMContentLoaded', optionsPageInit)

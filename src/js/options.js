import '../styles/commonStyles.styl'
import '../styles/options.styl'
import { getSettings } from './utils'

import { isWebUri } from 'valid-url'


const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
const DOMoptionElements = {
  extTokenInput: $('#extensionToken'),
  googleSearchCheckbox: $('#googleSearchCheckbox'),
  bingSearchCheckbox: $('#bingSearchCheckbox'),
  duckduckgoSearchCheckbox: $('#duckduckgoSearchCheckbox'),
  baiduSearchCheckbox: $('#baiduSearchCheckbox'),
}

function firstRunCheck(extensionToken){
  const navListElems = $$('#optionsPanel nav li')
  if(!isWebUri(extensionToken.split(',')[0])){
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

function saveOptions() {
  chrome.storage.local.set(
    Object
      .values(DOMoptionElements)
      .reduce((settingsObj, optionElement) => {
        settingsObj[optionElement.dataset.settingKey] = getOptionElementValue(optionElement)
        return settingsObj
      },
      {}
    )
  )
}

function setInitialDOMoptionValues(options) {
  Object
    .values(DOMoptionElements)
    .forEach(optionElement => {
      const settingKey = optionElement.dataset.settingKey
      if(optionElement.matches('input[type="checkbox"]')){
        optionElement.checked = options[settingKey]
      }
      else{
        optionElement.value = options[settingKey]
      }
    })
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

function setUpEventListeners() {
  $('#optionsPanel nav').addEventListener('click', evt => settingsTabsBehaviour(evt.target))
  /*****
  * const seems to be valid in for of loops - http://bit.ly/2eYKQd1 http://bit.ly/2eYECtO
  */
  for(const inputElem of $$('input')){
    inputElem.addEventListener('change', saveOptions)
  }
  /*****
  * Also need .addEventListener('input' for extTokenInput as $('input').addEventListener('change'
  * only fires for text input change once it loses focus, so using .addEventListener('input' as
  * well so it saves straight away on paste.
  */
  DOMoptionElements.extTokenInput.addEventListener('input', saveOptions)
}

getSettings()
  .then(options => {
    setInitialDOMoptionValues(options)
    settingsTabsBehaviour(firstRunCheck(options.extensionToken))
    setUpHelpAboutPage()
    setUpEventListeners()
  })

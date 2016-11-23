import '../../styles/commonStyles.styl'
import '../../styles/options.styl'
import { getSettings, $, $$ } from '../utils'
import { getOptionElementValue } from './optionUtils'

import { isWebUri } from 'valid-url'

const optionElements = $$('*[data-setting-key]')


function firstRunCheck(extensionToken){
  const navListElems = $$('#optionsPanel nav li')
  /*****
  * IF a valid url isn't in the token before the comma, then show the setup tab.
  */
  if(!isWebUri(extensionToken.split(',')[0])){
    /*****
    * navListElems[1] is the setup tab - show that if its the first run
    */
    return navListElems[1]
  }
  return navListElems[0]
}

function saveOptions() {
  console.log('saveOptions called')
  console.log(
    Array
      .from(optionElements)  // convert NodeList to Array
      .reduce(
        (settingsObj, optionElement) => {
          settingsObj[optionElement.dataset.settingKey] = getOptionElementValue(optionElement)
          return settingsObj
        },
        {}
      )
  )
  // chrome.storage.local.set(
  //   Array
  //     .from(optionElements)  // convert NodeList to Array
  //     .reduce(
  //       (settingsObj, optionElement) => {
  //         settingsObj[optionElement.dataset.settingKey] = getOptionElementValue(optionElement)
  //         return settingsObj
  //       },
  //       {}
  //     )
  // )
}

function setInitialDOMoptionValues(options) {
  Array
    .from(optionElements)  // convert NodeList to Array
    .forEach(optionElement => {
      const settingKey = optionElement.dataset.settingKey
      if(optionElement.matches('input[type="checkbox"], input[type="radio"]')){
        optionElement.checked = options[settingKey]
      }
      else{
        optionElement.value = options[settingKey]
      }
    })
}

function setUpHelpAboutPage() {
  const versionText = `MarkSearch Chrome Extension Version: ${ chrome.runtime.getManifest().version }`
  $('#marksearchChromeExtensionVersionNumber').innerText = versionText
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
  $('#optionsPanel nav').addEventListener('click', evt => settingsTabsBehaviour(evt.currentTarget))
  /*****
  * const seems to be valid in for of loops - http://bit.ly/2eYKQd1 http://bit.ly/2eYECtO
  */
  for(const inputElem of optionElements){
    /*****
    * For the #msResultsBox radio buttons, if the user clicks on one and the other is checked, uncheck
    * the other one and leave the one they clicked on checked (and ignore if the one they clicked on is alrady checked).
    */
    if(inputElem.className === 'msResultsBoxRadio'){
      inputElem.addEventListener('change', event => {
        if(!event.currentTarget.checked){
          return
        }
        if(event.currentTarget.id === 'msResultsBoxRadio1'){
          $('#msResultsBoxRadio2').checked = false
        }
        if(event.currentTarget.id === 'msResultsBoxRadio2'){
          $('#msResultsBoxRadio1').checked = false
        }
        saveOptions()
      })
    }
    else{
      inputElem.addEventListener('change', saveOptions)
    }
    if(inputElem.dataset.settingKey === 'extensionToken'){
      /*****
      * Also need .addEventListener('input' for extensionToken Input as $('input').addEventListener('change'
      * only fires for text input change once it loses focus, so using .addEventListener('input' as
      * well so it saves straight away on paste.
      */
      inputElem.addEventListener('input', saveOptions)
    }
  }
}

getSettings()
  .then(options => {
    setInitialDOMoptionValues(options)
    settingsTabsBehaviour(firstRunCheck(options.extensionToken))
    setUpHelpAboutPage()
    setUpEventListeners()
  })

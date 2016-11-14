import '../styles/commonStyles.styl'
import '../styles/options.styl'

import { getSettings } from './utils'

function firstRunCheck(extensionToken){
  const navListElems$ = $('#optionsPanel nav li')
  let tabToDisplay = navListElems$[0]
  if(extensionToken.indexOf(',') === -1){
    /*****
    * navListElems$[1] is the setup tab - show that if its the first run
    */
    tabToDisplay = navListElems$[1]
  }
  return tabToDisplay
}

function saveOptions(DOMoptionElements) {
  // console.log('saving options')
  // console.log('saved settingsObj',
  //   Object
  //     .keys(DOMoptionElements)
  //     .reduce((settingsObj, keyname) => {
  //       const optionElement$ = DOMoptionElements[keyname]
  //       let optionElemValue = optionElement$.val()
  //       if(optionElemValue === 'true'){
  //         optionElemValue = true
  //       }
  //       if(optionElemValue === 'false'){
  //         optionElemValue = false
  //       }
  //       if(optionElement$.is('input[type="checkbox"]')){
  //         optionElemValue = optionElement$[0].checked
  //       }
  //       settingsObj[optionElement$.data('settingKey')] = optionElemValue
  //       return settingsObj
  //     },
  //     {}
  //   )
  // )
  chrome.storage.local.set(
    Object
      .keys(DOMoptionElements)
      .reduce((settingsObj, keyname) => {
        const optionElement$ = DOMoptionElements[keyname]
        let optionElemValue = optionElement$.val()
        if(optionElemValue === 'true'){
          optionElemValue = true
        }
        if(optionElemValue === 'false'){
          optionElemValue = false
        }
        if(optionElement$.is('input[type="checkbox"]')){
          optionElemValue = optionElement$[0].checked
        }
        settingsObj[optionElement$.data('settingKey')] = optionElemValue
        return settingsObj
      },
      {}
    )
  )
}

function setInitialDOMoptionValues(options, DOMoptionElements) {
  console.log('setInitialDOMoptionValues options: ', options)
  DOMoptionElements.extTokenInput$.val(options.extensionToken)
  DOMoptionElements.googleSearchCheckbox$[0].checked = options.integrateWithGoogleSearch
  DOMoptionElements.bingSearchCheckbox$[0].checked = options.integrateWithBingSearch
  DOMoptionElements.duckduckgoSearchCheckbox$[0].checked = options.integrateWithDuckduckgoSearch
  DOMoptionElements.baiduSearchCheckbox$[0].checked = options.integrateWithBaiduSearch
}

function setUpHelpAboutPage() {
  const versionText = `MarkSearch Version: ${ chrome.runtime.getManifest().version }`
  $('#marksearchVersionNumber').text(versionText)
}

function settingsTabsBehaviour(selectedListElement) {
  $('#optionsPanel nav li').each((index, el) => {
    const elDataSet = el.dataset.showHideDivId
    if(selectedListElement === el){
      el.className = 'selected'
      $(elDataSet)[0].className = 'show'
    }
    else{
      el.className = ''
      $(elDataSet)[0].className = 'hide'
    }
  })
}

function setUpEventListeners(DOMoptionElements) {
  $('#optionsPanel nav').on('click', evt => settingsTabsBehaviour(evt.target))
  $('input').on('change', () => saveOptions(DOMoptionElements))
  /*****
  * Also need .on('input' for extTokenInput$ as $('input').on('change' only fires for text input
  * change once it loses focus, so using .on('input' as well so it saves straight away on paste.
  */
  DOMoptionElements.extTokenInput$.on('input', () => saveOptions(DOMoptionElements))
}

function optionsPageInit() {
  const DOMoptionElements = {
    extTokenInput$: $('#extensionToken'),
    googleSearchCheckbox$: $('#googleSearchCheckbox'),
    bingSearchCheckbox$: $('#bingSearchCheckbox'),
    duckduckgoSearchCheckbox$: $('#duckduckgoSearchCheckbox'),
    baiduSearchCheckbox$: $('#baiduSearchCheckbox'),
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

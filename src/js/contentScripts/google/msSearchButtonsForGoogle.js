import { $ } from '../../utils'
import { getMSserverAddress, generateMSserverSearchUrl } from '../CS_utils'

const observerSettings = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
  attributeOldValue: false,
  characterDataOldValue: false
}
let msSearchButtonForSearchPage
let msSearchButtonForResultsPage

function setUpMarkSearchSearchButtons(isInstantSearch){
  const searchPageCenteredButtons = $('#tsf>div:not(#tophf)>div>center')
  /*****
  * Setting them as <a> elements so that they don't accidentally trigger the google search form it is inside.
  */
  msSearchButtonForSearchPage = document.createElement('a')
  msSearchButtonForSearchPage.textContent = 'Search MarkSearch'
  msSearchButtonForSearchPage.setAttribute('class', 'msSearchButtonSearchPageGoogle')
  msSearchButtonForSearchPage.addEventListener('mouseup', msSearchButtonsEventHandler)

  searchPageCenteredButtons.appendChild(msSearchButtonForSearchPage)

  msSearchButtonForResultsPage = document.createElement('a')
  msSearchButtonForResultsPage.setAttribute('title', 'Search And Open MarkSearch With These Search Terms')
  msSearchButtonForResultsPage.setAttribute('class', 'msSearchButtonResultsPageGoogle')

  const msSearchButtonForResultsPageText = document.createElement('span')
  msSearchButtonForResultsPageText.textContent = 'MS'

  msSearchButtonForResultsPage.appendChild(msSearchButtonForResultsPageText)
  /*****
  * Backup in case they change the svg: http://bit.ly/2iShqNK
  */
  msSearchButtonForResultsPage.appendChild($('#sfdiv>button>span>svg').cloneNode(true))
  msSearchButtonForResultsPage.addEventListener('mouseup', msSearchButtonsEventHandler)

  $('#tsf').firstElementChild.insertAdjacentElement('beforebegin', msSearchButtonForResultsPage)

  /*****
  * When it's not instant search, the search page shows a popup for the search autocomplete that has the "Google Search"
  * and "I'm Feeling Lucky" buttons, so insert a MarkSearch button in there too. Note: we dont have to check if it's a
  * search page as if it isn't the button's conatiners are hidden by the page css.
  *
  * On page load, the search autocomplete popup hasn't been fully constructed yet, so listen for that with a mutation
  * observer.
  */
  if(!isInstantSearch){

    const autocompletePopupBoxContainer = $('#sbtc>div:last-child>div:last-child:not(#sfopt)')
    //     const autocompletePopupBoxContainerChildReference = autocompletePopupBoxContainer.firstElementChild

    const autoCompletePopupMutationObserver = new MutationObserver(mutations => {
      console.log(`mutations`, mutations)
      console.log(`mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target))`, mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target)))
      // if(mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target))){
      //   autoCompletePopupMutationObserver.disconnect()
      //
      //   const autocompletePopupBoxSearchButtonsContainer = autocompletePopupBoxContainer.querySelector('ul[role="listbox"]>li:last-child>div')
      //   const lastSearchButton = autocompletePopupBoxSearchButtonsContainer.lastElementChild
      //   const msAutoCompletePopupSearchButton = lastSearchButton.cloneNode(true)
      //   msAutoCompletePopupSearchButton.value = 'Search MarkSearch'
      //   console.log('msAutoCompletePopupSearchButton', msAutoCompletePopupSearchButton)
      //   autocompletePopupBoxSearchButtonsContainer.appendChild(msAutoCompletePopupSearchButton)
      //   //make sure as well as changing color on hover, it changes color on selected
      // }
    })
    autoCompletePopupMutationObserver.observe(autocompletePopupBoxContainer, observerSettings)
    window.setTimeout(() => {
      console.log('autocompletePopupBoxContainer', autocompletePopupBoxContainer)
    }, 5000)

//     const autocompletePopupBoxContainer = $('#sbtc>div:last-child>div:last-child:not(#sfopt)')
//
//     const autoCompletePopupMutationObserver = new MutationObserver(mutations => {
//       // console.log(`mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target))`, mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target)))
//       if(mutations.find(({target}) => autocompletePopupBoxContainer.firstElementChild.isSameNode(target))){
//         autoCompletePopupMutationObserver.disconnect()
//
//         const autocompletePopupBoxSearchButtonsContainer = autocompletePopupBoxContainer.querySelector('ul[role="listbox"]>li:last-child>div')
//         const lastSearchButton = autocompletePopupBoxSearchButtonsContainer.lastElementChild
//         const msAutoCompletePopupSearchButton = lastSearchButton.cloneNode(true)
//         msAutoCompletePopupSearchButton.value = 'Search MarkSearch'
// console.log('msAutoCompletePopupSearchButton', msAutoCompletePopupSearchButton)
//         autocompletePopupBoxSearchButtonsContainer.appendChild(msAutoCompletePopupSearchButton)
//         //make sure as well as changing color on hover, it changes color on selected
//       }
//     })
    // autoCompletePopupMutationObserver.observe(autocompletePopupBoxContainer, observerSettings)
  }
}

function msSearchButtonsEventHandler(event){
  event.preventDefault()
  const msServerAddress = getMSserverAddress()
  const searchTerms = $('#lst-ib').value.trim()

  if(!msServerAddress || !searchTerms.length){
    return
  }

  const msServerSearchUrl = generateMSserverSearchUrl(msServerAddress, searchTerms)
  /*****
  * We open a new tab if we are on the results, page. We use the current tab if we are on the search page.
  */
  if(event.currentTarget.classList.contains('msSearchButtonResultsPageGoogle')){
    window.open(msServerSearchUrl)
  }
  else{
    window.location.href = msServerSearchUrl
  }
}

export {
  setUpMarkSearchSearchButtons,
}

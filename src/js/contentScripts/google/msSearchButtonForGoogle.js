import { getMSserverAddress, generateMSserverSearchUrl } from '../CS_utils'


let msSearchButtonForSearchPage
let msSearchButtonForResultsPage

function setUpMarkSearchSearchButton(){
  const searchElementsContainer = document.querySelector('#tsf>div:not(#tophf)')

  /*****
  * Setting it as an <a> so that it doesnt accidentally trigger the google search form it is inside.
  */
  msSearchButtonForSearchPage = document.createElement('a')
  msSearchButtonForSearchPage.textContent = 'Search MarkSearch'
  msSearchButtonForSearchPage.setAttribute('class', 'msSearchButtonSearchPageGoogle')

  msSearchButtonForSearchPage.addEventListener('mouseup', msSearchButtonForSearchPageEventHandler)

  searchElementsContainer.querySelector('center').appendChild(msSearchButtonForSearchPage)

  msSearchButtonForResultsPage = document.createElement('button')

  searchElementsContainer.querySelector('#sbtc').parentNode.insertAdjacentElement('beforebegin', msSearchButtonForResultsPage)
}

function msSearchButtonForSearchPageEventHandler(){
  const msServerAddress = getMSserverAddress()
  const searchTerms = document.querySelector('#lst-ib').value.trim()

  if(!msServerAddress || !searchTerms.length){
    return
  }

  window.location.href = generateMSserverSearchUrl(msServerAddress, searchTerms)
}

function updateMSsearchButtonLink(){
  if(!msSearchButtonForSearchPage && !msSearchButtonForResultsPage){
    return
  }
  msSearchButtonForSearchPage
  msSearchButtonForResultsPage
}

export {
  setUpMarkSearchSearchButton,
  updateMSsearchButtonLink,
}

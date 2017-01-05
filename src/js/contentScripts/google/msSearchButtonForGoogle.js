import { $ } from '../../utils'
import { getMSserverAddress, generateMSserverSearchUrl } from '../CS_utils'


let msSearchButtonForSearchPage
let msSearchButtonForResultsPage

function setUpMarkSearchSearchButton(){
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
  /*****
  * The 'hp' class is from the page. When it is the search page, the body has a class of 'hp', so gonna use that as
  * it saves us having to manually check.
  */
  msSearchButtonForResultsPage.setAttribute('class', 'msSearchButtonResultsPageGoogle hp')

  const msSearchButtonForResultsPageText = document.createElement('span')
  msSearchButtonForResultsPageText.textContent = 'MS'

  msSearchButtonForResultsPage.appendChild(msSearchButtonForResultsPageText)
  /*****
  * Backup in case they change the svg: http://bit.ly/2iShqNK
  */
  msSearchButtonForResultsPage.appendChild($('#sfdiv>button>span>svg').cloneNode(true))
  msSearchButtonForResultsPage.addEventListener('mouseup', msSearchButtonsEventHandler)

  $('#tsf').firstElementChild.insertAdjacentElement('beforebegin', msSearchButtonForResultsPage)
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

import { $ } from '../../utils'
import { getMSserverAddress, generateMSserverSearchUrl } from '../CS_utils'

function setUpMarkSearchSearchButtons(){
  const msSearchButtonForResultsPage = document.createElement('a')
  msSearchButtonForResultsPage.setAttribute('title', 'Search And Open MarkSearch With These Search Terms')
  msSearchButtonForResultsPage.classList.add('normalizeCSS')
  msSearchButtonForResultsPage.classList.add('msSearchButtonResultsPageGoogle')

  const msSearchButtonForResultsPageText = document.createElement('span')
  msSearchButtonForResultsPageText.textContent = 'MS'

  msSearchButtonForResultsPage.appendChild(msSearchButtonForResultsPageText)
  /*****
  * Backup in case they change the svg: http://bit.ly/2iShqNK
  */
  msSearchButtonForResultsPage.appendChild($('#sfdiv>button>span>svg').cloneNode(true))
  msSearchButtonForResultsPage.addEventListener('mouseup', msSearchButtonsEventHandler)

  // $('#tsf').firstElementChild.insertAdjacentElement('beforebegin', msSearchButtonForResultsPage)
  $('#logocont').insertAdjacentElement('beforebegin', msSearchButtonForResultsPage)

}

function msSearchButtonsEventHandler(event){
  event.preventDefault()
  const msServerAddress = getMSserverAddress()
  const searchTerms = $('#lst-ib').value.trim()

  if(!msServerAddress || !searchTerms.length){
    return
  }

  const msServerSearchUrl = generateMSserverSearchUrl(msServerAddress, searchTerms)

  window.open(msServerSearchUrl)
}

export {
  setUpMarkSearchSearchButtons,
}

import { extensionSettings } from './googleSearch_ContentScript'
import { msResultsBoxResultsContainer } from './markSearchResultsBox'
import { createMSresultElements } from './createMSresultElements'
import { generateMassTempResultsForDev } from '../../utils'

function renderMarkSearchResultsBoxResults(markSearchResults, searchTerms){
  console.log('renderMarkSearchResultsBoxResults')
  console.log('renderMarkSearchResultsBoxResults markSearchResults:', markSearchResults)
  console.log('renderMarkSearchResultsBoxResults searchTerms:', searchTerms)
  msResultsBoxResultsContainer.innerHTML = ''

  const msResultsBoxDocFragment = document.createDocumentFragment()
  const resultsAmountDiv = document.createElement('div')
  resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
  resultsAmountDiv.textContent = `${ markSearchResults.length } Results`
  msResultsBoxDocFragment.appendChild(resultsAmountDiv)

  if(markSearchResults.length > 0){
    /*****
    * Generate lots of results when in development so we can check ui stuff.
    */
    if(extensionSettings.isDevelopment){
      markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
    }

    for(let index = 0, len = markSearchResults.length; index < len; index++){
      msResultsBoxDocFragment.appendChild(
        createMSresultElements(markSearchResults[index], index, searchTerms)
      )
    }
  }


  msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
}

export {
  renderMarkSearchResultsBoxResults
}

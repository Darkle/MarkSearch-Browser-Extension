import { getSetting, generateMassTempResultsForDev } from './CS_utils'
import { msResultsBoxResultsContainer } from './markSearchResultsBox'
import { createMSresultElements } from './createMSresultElements'

function renderMarkSearchResultsBoxResults(markSearchResults, searchTerms){
  console.log('renderMarkSearchResultsBoxResults')
  console.log('renderMarkSearchResultsBoxResults markSearchResults:', markSearchResults)
  console.log('renderMarkSearchResultsBoxResults searchTerms:', searchTerms)

  const msResultsBoxDocFragment = document.createDocumentFragment()
  const resultsAmountDiv = document.createElement('div')
  resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
  resultsAmountDiv.textContent = `${ markSearchResults.length } Results From MarkSearch`
  msResultsBoxDocFragment.appendChild(resultsAmountDiv)

  if(markSearchResults.length > 0){
    /*****
    * Generate lots of results when in development so we can check ui stuff.
    */
    if(getSetting('isDevelopment')){
      markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
    }

    for(let index = 0, len = markSearchResults.length; index < len; index++){   // eslint-disable-line no-restricted-syntax
      msResultsBoxDocFragment.appendChild(
        createMSresultElements(markSearchResults[index], index, searchTerms)
      )
    }
  }
  /*****
  * Batch the dom writes together.
  */
  msResultsBoxResultsContainer.innerHTML = ''
  msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
}

export {
  renderMarkSearchResultsBoxResults
}

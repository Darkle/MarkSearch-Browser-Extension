import { extensionSettings } from './googleSearch_ContentScript'
import { msResultsBoxResultsContainer } from './setUpMSresultsBox'
import { createMSresultElements } from './createMSresultElements'
import { generateMassTempResultsForDev } from '../../utils'

function renderMarkSearchResultsBoxResults(markSearchResults, searchTerms){
  msResultsBoxResultsContainer.innerHTML = ''

  const msResultsBoxDocFragment = document.createDocumentFragment()
  const resultsAmountDiv = document.createElement('div')
  resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
  resultsAmountDiv.textContent = `${ markSearchResults.length } Results`
  msResultsBoxDocFragment.appendChild(resultsAmountDiv)

  if(extensionSettings.isDevelopment){
    markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
  }

  for(let index = 0, len = markSearchResults.length; index < len; index++){
    msResultsBoxDocFragment.appendChild(
      createMSresultElements(markSearchResults[index], index, searchTerms)
    )
  }

  msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
}

export {
  renderMarkSearchResultsBoxResults
}

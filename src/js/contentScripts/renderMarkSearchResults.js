// import { getSetting, generateMassTempResultsForDev } from './CS_utils'
import { msResultsBoxResultsContainer } from './markSearchResultsBox'
import { createMSresultElements } from './createMSresultElements'
import { getMSserverAddress, createMSserverSearchLink } from './CS_utils'

function renderMarkSearchResultsBoxResults(markSearchResults, searchTerms){
  console.log('renderMarkSearchResultsBoxResults')
  console.log('renderMarkSearchResultsBoxResults markSearchResults:', markSearchResults)
  console.log('renderMarkSearchResultsBoxResults searchTerms:', searchTerms)

  const msResultsBoxDocFragment = document.createDocumentFragment()

  msResultsBoxDocFragment.appendChild(createResultsAmountElements(markSearchResults, searchTerms))

  if(markSearchResults.length > 0){
    /*****
    * Generate lots of results when in development so we can check ui stuff.
    */
    // if(getSetting('isDevelopment')){
    //   markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
    // }

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
/*****
* We create a link for the top of the MS results (in the results amount details) so that the user can
* click on it and have the current search be openined in the MarkSearch server search page.
*/
function createResultsAmountElements(markSearchResults, searchTerms){
  const resultsAmountDiv = document.createElement('div')
  resultsAmountDiv.setAttribute('id', 'resultsBoxCount')

  /*****
  * If it's 0 or more than 1, we want plural, otherwise if it's 1, just 'Result'
  */
  const resultPluralText = markSearchResults.length === 1 ? 'Result' : 'Results'

  const resultsAmountStartingText = document.createElement('span')
  resultsAmountStartingText.textContent = `${ markSearchResults.length } ${ resultPluralText } From `

  resultsAmountDiv.appendChild(resultsAmountStartingText)

  const msServerAddress = getMSserverAddress()

  if(!msServerAddress || !searchTerms){
    resultsAmountDiv.appendChild(document.createTextNode('MarkSearch'))
  }
  else{
    const msSearchServerLinkContent = 'MarkSearch'
    const msSearchServerLink = createMSserverSearchLink(msServerAddress, searchTerms, msSearchServerLinkContent)

    resultsAmountDiv.appendChild(msSearchServerLink)
  }

  return resultsAmountDiv
}

export {
  renderMarkSearchResultsBoxResults
}

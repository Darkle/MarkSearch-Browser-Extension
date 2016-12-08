import { extensionSettings } from './googleSearch_ContentScript'
import { msResultsBoxResultsContainer, setMSresultsBoxHeight } from './setUpMSresultsBox'
import { createMSresultElements } from './createMSresultElements'

function renderMarkSearchResults(searchResults, rsoElement, searchEngineResults, searchTerms){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  console.log('searchEngineResults', searchEngineResults)
  console.log('searchEngineResults.length', searchEngineResults.length)

  const {
    msResultsBox,
    msResultsAtTop,
    msResultsInterspersed,
    msResultsAtBottom,
    numberOfIntegratedResultsToShow
  } = extensionSettings
  let msResultsBoxDocFragment
  let topOrBottomResultsContainer

  if(msResultsBox){
    // for(const msResultsBoxResult of $$('#msResultsBox .marksearchResultsBoxResult')){
    //   msResultsBoxResult.remove()
    // }
    msResultsBoxResultsContainer.innerHTML = ''

    msResultsBoxDocFragment = document.createDocumentFragment()
    const resultsAmountDiv = document.createElement('div')
    resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
    resultsAmountDiv.textContent = `${ searchResults.length } Results`
    msResultsBoxDocFragment.appendChild(resultsAmountDiv)
  }
  /*****
  * Not using a document fragment for top and bottom integrated results as we would be inserting
  * the fragments after the interspersed MarkSearch results had been inserted into the page, which
  * would probably not look as good because you would see them appear slightly later than the
  * interspersed ones.
  */
  if(msResultsAtTop || msResultsAtBottom){
    topOrBottomResultsContainer = document.createElement('div')
    const idFragment = msResultsAtTop ? 'Top' : 'Bottom'
    topOrBottomResultsContainer.setAttribute('id', `markSearch${ idFragment }ResultsContainer`)
  }

  let tempResults = []
  if(searchResults[0]){
    tempResults = Array(500)
                    .fill(searchResults[0])
                    .map((item, index) =>
                      Object.assign({}, item, {pageTitle: `${ item.pageTitle } ${ index + 1 }`})
                    )
  }

  /*****
  * Using 2 loops so we can break out of the second loop early. Say there are 1000 results
  * from MarkSearch, we won't be displaying them all on the page for the integrated results,
  * so having a second loop where we can break early makes sense.
  */
  if(msResultsBox){
    tempResults.forEach((result, index) => {
      msResultsBoxDocFragment.appendChild(createMSresultElements(result, index, searchTerms))
    })
  }

  if(msResultsAtTop || msResultsInterspersed || msResultsAtBottom){
    for(let index = 0, len = tempResults.length; index < len; index++){
      const result = tempResults[index]
      const resultDiv = createMSresultElements(result, index, searchTerms)
      const resultNumber = index + 1

      if( (msResultsAtTop || msResultsAtBottom) && resultNumber <= numberOfIntegratedResultsToShow){
        topOrBottomResultsContainer.appendChild(resultDiv)
      }
      /*****
      * We make sure not to insert more than how many native search results there are on the page.
      */
      else if(msResultsInterspersed && resultNumber <= searchEngineResults.length ){
        /*****
        * we start inserting interspersed at the first searchEngineResults (searchEngineResults[0])
        * Note: for insertBefore(), if referenceNode is null, the newNode is inserted at the end of the
        * list of child nodes
        * resultNumber is index + 1, which is what we want as we want to insert it after the result by
        * inserting it before the next result. Using insertBefore() instead of .after() as the latter is
        * not supported in Edge.
        */
        const nodeToInsertBefore = searchEngineResults[resultNumber] ? searchEngineResults[resultNumber] : null
        rsoElement.insertBefore(resultDiv, nodeToInsertBefore)
      }
      else{
        break
      }
    }
  }
  /*****
  * because when we insert MS results into the page, it changes the height of the #res element, so we need to
  * re-set the msResultsBoxElem height.
  */
  if(msResultsBox){
    setMSresultsBoxHeight()
    msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
  }
  if(msResultsAtTop){
    rsoElement.insertBefore(topOrBottomResultsContainer, rsoElement.firstElementChild)
  }
  if(msResultsAtBottom){
    rsoElement.appendChild(topOrBottomResultsContainer)
  }
}

export {
  renderMarkSearchResults
}

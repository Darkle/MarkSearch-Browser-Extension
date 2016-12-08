import { extensionSettings } from './googleSearch_ContentScript'
import { msResultsBoxResultsContainer, setMSresultsBoxHeight } from './setUpMSresultsBox'
import { createMSresultElements } from './createMSresultElements'

function calculateEndResultNumber(){
  let endResultNumberToShowAtTop = 0
  let endResultNumberToIntersperse = 0
  let endResultNumberToShowAtBottom = 0

  if(extensionSettings.msResultsAtTop){
    endResultNumberToShowAtTop = extensionSettings.msResultsAtTop_numberOfResultsToShow
  }
  if(extensionSettings.msResultsInterspersed){
    endResultNumberToIntersperse = endResultNumberToShowAtTop +
                                    extensionSettings.msResultsInterspersed_numberOfResultsToShow
  }
  /*****
  * endResultNumberToIntersperse already includes the endResultNumberToShowAtTop, so don't need to
  * add it again.
  */
  if(extensionSettings.msResultsAtBottom){
    endResultNumberToShowAtBottom = endResultNumberToIntersperse +
                                      extensionSettings.msResultsAtBottom_numberOfResultsToShow
  }
  return [endResultNumberToShowAtTop, endResultNumberToIntersperse, endResultNumberToShowAtBottom]
}

function renderMarkSearchResults(searchResults, rsoElement, searchEngineResults, searchTerms){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  console.log('searchEngineResults', searchEngineResults)
  console.log('searchEngineResults.length', searchEngineResults.length)

  const [
    endResultNumberToShowAtTop,
    endResultNumberToIntersperse,
    endResultNumberToShowAtBottom
  ] = calculateEndResultNumber()
  const {
    msResultsBox,
    msResultsAtTop,
    msResultsInterspersed,
    msResultsAtBottom
  } = extensionSettings
  let msResultsBoxDocFragment
  let topResultsContainer
  let bottomResultsContainer

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
  if(msResultsAtTop){
    topResultsContainer = document.createElement('div')
    topResultsContainer.setAttribute('id', 'markSearchTopResultsContainer')
    rsoElement.insertBefore(topResultsContainer, rsoElement.firstElementChild)
  }
  if(msResultsAtBottom){
    bottomResultsContainer = document.createElement('div')
    bottomResultsContainer.setAttribute('id', 'markSearchBottomResultsContainer')
    rsoElement.appendChild(bottomResultsContainer)
  }
  let tempResults = []
  if(searchResults[0]){
    tempResults = Array(500)
                    .fill(searchResults[0])
                    .map((item, index) =>
                      Object.assign({}, item, {pageTitle: `${ item.pageTitle } ${ index + 1 }`})
                    )
  }

  let interspersedNodeToInsertAfter = 0

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

      if(msResultsAtTop && resultNumber <= endResultNumberToShowAtTop){
        topResultsContainer.appendChild(resultDiv)
      }
      /*****
      * We make sure here not to insert more than how many native search results there are on
      * the page.
      */
      else if(msResultsInterspersed &&
          resultNumber > endResultNumberToShowAtTop &&
          resultNumber <= endResultNumberToIntersperse &&
          interspersedNodeToInsertAfter <= (searchEngineResults.length -1)
      ){
        /*****
        * we start inserting interspersed at the first searchEngineResults (0)
        */
        searchEngineResults[interspersedNodeToInsertAfter].after(resultDiv)
        interspersedNodeToInsertAfter = interspersedNodeToInsertAfter + 1
      }
      /*****
      * endResultNumberToIntersperse is endResultNumberToShowAtTop + endResultNumberToIntersperse.
      * Note: we need the endResultNumberToShowAtBottom, because we dont want all of the rest of the results to be
      * shown, just how many the user specified for showing at the bottom.
      */
      else if(msResultsAtBottom &&
          resultNumber > endResultNumberToIntersperse &&
          resultNumber <= endResultNumberToShowAtBottom
      ){
        bottomResultsContainer.appendChild(resultDiv)
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
}

export {
  renderMarkSearchResults
}

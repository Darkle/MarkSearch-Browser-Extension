import { extensionSettings } from './googleSearch_ContentScript'
import { msResultsBoxResultsContainer, setMSresultsBoxHeight } from './setUpMSresultsBox'
import { createMSresultElements } from './createMSresultElements'

function generateMassTempResultsForDev(markSearchResults){
  let tempResults = []
  if(markSearchResults[0]){
    tempResults = Array(500)
                    .fill(markSearchResults[0])
                    .map((item, index) =>
                      Object.assign({}, item, {pageTitle: `${ item.pageTitle } ${ index + 1 }`})
                      // Object.assign(
                      //   {},
                      //   item,
                      //   {
                      //     pageTitle: `${ item.pageTitle } ${ index + 1 }`,
                      //     pageUrl: item.pageUrl.repeat(10)
                      //   }
                      // )
                    )
  }
  return tempResults
}

function renderMarkSearchResultsBoxResults(markSearchResults, searchTerms){
  if(!extensionSettings.msResultsBox){
    return
  }
  console.log('renderMarkSearchIntegratedResults')
  console.log('markSearchResults', markSearchResults)
  console.log('searchTerms', searchTerms)

  // for(const msResultsBoxResult of $$('#msResultsBox .marksearchResultsBoxResult')){
  //   msResultsBoxResult.remove()
  // }
  msResultsBoxResultsContainer.innerHTML = ''

  const msResultsBoxDocFragment = document.createDocumentFragment()
  const resultsAmountDiv = document.createElement('div')
  resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
  resultsAmountDiv.textContent = `${ markSearchResults.length } Results`
  msResultsBoxDocFragment.appendChild(resultsAmountDiv)

  if(extensionSettings.isDevelopment){
    markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
  }

  const resultIsForForMSresultsBox = true

  for(let index = 0, len = markSearchResults.length; index < len; index++){
    msResultsBoxDocFragment.appendChild(
      createMSresultElements(markSearchResults[index], index, searchTerms, resultIsForForMSresultsBox)
    )
  }
  /*****
  * When we insert MS results into the page, it changes the height of the #res element, so we need to
  * re-set the msResultsBoxElem height.
  */
  setMSresultsBoxHeight()
  msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
}

function renderMarkSearchIntegratedResults(markSearchResults, rsoElement, searchEngineResults, searchTerms){
  const {
    msResultsAtTop,
    msResultsInterspersed,
    msResultsAtBottom,
    numberOfIntegratedResultsToShow,
    isDevelopment
  } = extensionSettings

  if(!msResultsAtTop && !msResultsInterspersed && !msResultsAtBottom){
    return
  }
  console.log('renderMarkSearchIntegratedResults')
  console.log('renderMarkSearchResults', markSearchResults)
  console.log('searchTerms', searchTerms)
  console.log('rsoElement', rsoElement)
  console.log('searchEngineResults', searchEngineResults)
  console.log('searchEngineResults.length', searchEngineResults.length)

  let topOrBottomDocFragment

  if(msResultsAtTop || msResultsAtBottom){
    topOrBottomDocFragment = document.createDocumentFragment()
    // const idFragment = msResultsAtTop ? 'Top' : 'Bottom'
    // topOrBottomResultsContainer.setAttribute('id', `markSearch${ idFragment }ResultsContainer`)
  }
  if(isDevelopment){
    markSearchResults = generateMassTempResultsForDev(markSearchResults)  // eslint-disable-line no-param-reassign
  }

  const resultIsForForMSresultsBox = false
  /*****
  * Using a for loop so we can break out of it early - say there are 1000 results from MarkSearch, we
  * won't be displaying them all on the page for the integrated results, so having a loop where we
  * can break early makes sense.
  */
  for(let index = 0, len = markSearchResults.length; index < len; index++){
    const result = markSearchResults[index]
    const resultNumber = index + 1
    const resultDiv = createMSresultElements(result, index, searchTerms, resultIsForForMSresultsBox)

    if((msResultsAtTop || msResultsAtBottom) && resultNumber <= numberOfIntegratedResultsToShow){
      topOrBottomDocFragment.appendChild(resultDiv)
    }
    /*****
    * We make sure not to insert more than how many search engine results there are on the page.
    * Also need to account for if there are no search engine results, but there are MarkSearch results.
    */
    else if(msResultsInterspersed && resultNumber <= numberOfIntegratedResultsToShow){
      if(!searchEngineResults.length){
        /*****
        * The interspersed results aren't created in a document fragment first because each MS result needs
        * to go after each individual result on the page, which means we are doing a lot of seperate writes
        * to the dom, so using requestAnimationFrame to batch the dom writes together in the next frame.
        */
        window.requestAnimationFrame(() => {
          rsoElement.appendChild(resultDiv)
        })
      }
      else if(resultNumber <= searchEngineResults.length){
        /*****
        * we start inserting interspersed at the first searchEngineResults (searchEngineResults[0])
        * Note: for insertBefore(), if referenceNode is null, the newNode is inserted at the end of the
        * list of child nodes - or that instance, we fall back to using the #rso element as the parentNode.
        *
        * resultNumber is index + 1, which is what we want as we want to insert it after the result by
        * inserting it before the next result. Using insertBefore() instead of .after() as the latter is
        * not supported in Edge.
        *
        * It probably makes sense to use a requestAnimationFrame here since
        */
        let nodeToInsertBefore = null
        let nodeToInsertBeforeParent = rsoElement
        if(searchEngineResults[resultNumber]){
          nodeToInsertBefore = searchEngineResults[resultNumber]
          nodeToInsertBeforeParent = nodeToInsertBefore.parentNode
        }
        /*****
        * The interspersed results aren't created in a document fragment first because each MS result needs
        * to go after each individual result on the page, which means we are doing a lot of seperate writes
        * to the dom, so using requestAnimationFrame to batch the dom writes together in the next frame.
        */
        window.requestAnimationFrame(() => {
          nodeToInsertBeforeParent.insertBefore(resultDiv, nodeToInsertBefore)
        })
      }
    }
    else{
      break
    }
  }
  if(msResultsAtTop){
    rsoElement.insertBefore(topOrBottomDocFragment, rsoElement.firstElementChild)
  }
  if(msResultsAtBottom){
    rsoElement.appendChild(topOrBottomDocFragment)
  }
}

export {
  renderMarkSearchResultsBoxResults,
  renderMarkSearchIntegratedResults
}

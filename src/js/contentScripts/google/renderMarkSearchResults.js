
// let msResultsContainer
// let firstRun = true

function renderMarkSearchResults(searchResults, rsoElement){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  // /*****
  // * Create the results container on first run or clear it.
  // */
  // if(firstRun){
  //   msResultsContainer = document.createElement('div')
  //   msResultsContainer.setAttribute('id', 'marksearchResultsContainer')
  // }
  // if(!firstRun){
  //   msResultsContainer.innerHTML = ''
  // }
  //
  // // for(let i = 0, len = searchResults.length; i < len; i++){
  // //   const result = searchResults[i]
  // //
  // // }
  //
  // /*****
  // * Delaying the append to make it more efficient. We want to create all the result elems and append them
  // * to the msResultsContainer before we append it to the page.
  // */
  // if(firstRun){
  //   firstRun = false
  //   document.body.appendChild(msResultsContainer)
  // }
}

// function removeMarkSearchResults(){
//   //NOTE may not need to remove the MS results that are above/intersperesed/below the search engine
//   //results as the search engine results container div might be removed by google
// }

export {
  renderMarkSearchResults,
  // removeMarkSearchResults
}

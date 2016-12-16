import { extensionSettings, latestInstantSearchRequestId, renderMarkSearchResultsBoxResultsIfReady } from './googleSearch_ContentScript'
import { setMSiconClass, getAddedNodesForTargetElement, findElementInNodeList, getRemovedNodesForTargetElement, isInstantSearch } from './googleSearchCSutils'
import { $ } from '../../utils'

let msResultsBoxResultsContainer
let msResultsBoxElem
let resElement
let observer
let MSresultsBoxHeight
let haveSetUpMSresultsBoxOnPageLoad = false

/*****
* We also reference the MS results box height so we can export it. We do this because
* we set up the MS results box before the search engine results have been inserted into the
* page and because of this, sometimes the #res element doesn't yet have a clientHeight, so
* in the mutationObserverHandler in googleSearch_ContentScript, we check if the MSresultsBoxHeight
* is 0, and if so, we call setMSresultsBoxHeight().
*
* setMSresultsBoxHeight() is also used in renderMarkSearchResults because when we insert
* MS results into the page, it changes the height of the #res element, so we need to
* re-set the msResultsBoxElem height.
*/
function setMSresultsBoxHeight(){
  MSresultsBoxHeight = resElement.clientHeight
  msResultsBoxElem.setAttribute('style', `height:${ MSresultsBoxHeight }px;`)
}

function setUpMSresultsBox(){

  msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')

  setMSresultsBoxHeight()

  const resultsBoxSideBar = document.createElement('div')
  resultsBoxSideBar.setAttribute('id', 'msResultsBoxSidebar')
  resultsBoxSideBar.addEventListener('click', () => {
    //will need to be http://caniuse.com/#search=animation
  })
  msResultsBoxElem.appendChild(resultsBoxSideBar)

  const msSidebarIcon = document.createElement('div')
  msSidebarIcon.setAttribute('id', 'msSidebarIcon')
  msSidebarIcon.textContent = 'MS'
  resultsBoxSideBar.appendChild(msSidebarIcon)

  const msSidebarIconHidden = document.createElement('div')
  msSidebarIconHidden.setAttribute('id', 'msSidebarIconHidden')
  msSidebarIconHidden.textContent = 'MS'
  resultsBoxSideBar.appendChild(msSidebarIconHidden)

  msResultsBoxResultsContainer = document.createElement('div')
  msResultsBoxResultsContainer.setAttribute('id', 'msResultsBoxResultsContainer')
  msResultsBoxElem.appendChild(msResultsBoxResultsContainer)

  if(extensionSettings.msResultsBox_Position === 'left'){
    msResultsBoxElem.classList.add('showMsResultsBoxOnLeft')
  }
  if(extensionSettings.msResultsBox_ShowViaAlwaysShow){
    msResultsBoxElem.classList.add('forceShowMsResultsBox')
  }
  /*****
  * We don't insert into the #rcnt element as it has a max-width set and doesn't expand fully,
  * and we don't insert higher up as we want the results box to be under the google
  * toolbars/buttons.
  */
  const rcnt = $('#rcnt')
  rcnt.parentNode.insertBefore(msResultsBoxElem, rcnt)

  /*****
  * We wanna have the MS icon in the search box be fixed and stay at the top of the results
  * box sidebar when the user scrolls down past the top of the results box.
  * We do this by using position:sticky in the css if the browser supports it, or by checking
  * manually on scroll where the icon is and and toggling a css class to make it position:fixed.
  * position:sticky is available in Firefox now and Chrome as of Jan 2017: http://bit.ly/2hCkkW4
  */
  if(!CSS.supports('position', 'sticky')){
    /*
    * Gonna do computedMsSidebarIconTop as a constant rather than computed as it wont change and
    * still seems to work ok even if the page is zoomed in.
    */
    // const computedMsSidebarIconTop = msSidebarIcon.getBoundingClientRect().top + scrollY
    const computedMsSidebarIconTop = 167
    /*****
    * Need to check on load in case the page is already scrolled down past the top of the
    * results box.
    */
    setMSiconClass(msSidebarIcon, computedMsSidebarIconTop)

    window.addEventListener('scroll',
      () => {
        setMSiconClass(msSidebarIcon, computedMsSidebarIconTop)
      },
      {
        passive: true
      }
    )
  }
  /*****
  * When it's instant seach, we have had to wait a bit before inserting the results box in to the page,
  * and there's a good chance the googleSearch_ContentScript has already received the MS search results, so
  * we need to call to render them if the're ready to be renderd.
  */
  if(isInstantSearch){
    renderMarkSearchResultsBoxResultsIfReady(latestInstantSearchRequestId)
  }
}

function instantSearchMutationHandler(mutations){
  /*****
  * getAddedResultNodesForElement finds a mutation that added stuff to the element you're looking for
  * (in this case the #search element), then returns the addedNodes NodeList from that mutation if it's
  * there (returns falsey if not).
  * Looking for the #search target here with the getAddedResultNodesForElement() call for on DOMContentLoaded as
  * it seems to be the best option as the other mutation targets don't seem that helpful. #search is not a bad
  * one to check since it's a direct child of #res
  */
  if(!haveSetUpMSresultsBoxOnPageLoad && getAddedNodesForTargetElement(mutations, 'search')){
    haveSetUpMSresultsBoxOnPageLoad = true
    resElement = $('#res')
    setUpMSresultsBox()
  }
  /*****
  * #cnt is removed an recreated/reinserted when the user clicks the back/forward button when using
  * instant search, so since the #cnt element is a parent of the MS results box element, we need to
  * recreate and reinsert the MS results box.
  */
  else if(findElementInNodeList('id', 'cnt', getRemovedNodesForTargetElement(mutations, 'main'))){
    resElement = $('#res')
    setUpMSresultsBox()
  }
}

function initMSresultsBox(){
  /*****
  * #res element isn't available yet on DOMContentLoaded when it's instant search,
  * so need to set an observer and wait. (we remove the observer once #res is available)
  * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
  *
  * We also use the observer for when the user clicks the back/forward buttons in the browser as that removes
  * the parent element that the MS results box was in so we have to recreate it.
  */
  if(isInstantSearch){
    observer = new MutationObserver(instantSearchMutationHandler)

    observer.observe(
      $('#main'),
      {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
        attributeOldValue: false,
        characterDataOldValue: false
      }
    )
    return
  }
  resElement = $('#res')
  setUpMSresultsBox()
}

export {
  initMSresultsBox,
  setMSresultsBoxHeight,
  msResultsBoxResultsContainer,
  MSresultsBoxHeight
}

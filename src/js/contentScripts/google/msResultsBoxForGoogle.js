import {
  msResultsBoxElem,
  resultsBoxSideBar,
  createMSresultsBox,
  setUpMSresultsBoxIcon,
  hideMSresultsBox,
  showMSresultsBox,
} from '../markSearchResultsBox'
import {
  generalResultsPageIsDisplayedForNonInstantSearch,
} from './googleSearchCSutils'
import { getSetting } from '../CS_utils'
import { $ } from '../../utils'

import debounce from 'lodash.debounce'

const centerColWidth = 632 + 140 + 55
const minimumMSresultsBoxWidth = 490
const msResultsBoxFallbackHeight = 'calc(100vh - 166px - 84px - 20px)'
const msResultsBoxMinimumHeight = 360
let msResultsBoxOldHeight
let documentClientWidth

function setUpMSresultsBoxForGoogle(isInstantSearch){
  createMSresultsBox()
  /*****
  * The msResultsBox_google class is for google specific styles for the MS results box.
  */
  msResultsBoxElem.classList.add('msResultsBox_google')
  /*****
  * We hide the MS results box by default (it's easier that way).
  */
  msResultsBoxElem.classList.add('msResultsBoxHide')
  /*****
  * If it's not instant search and we are not on the search page and we are on the general results page,
  * then show the MS results box for non instant search.
  *
  * For instant search, we need to rely on both the 'hp' class that the body has when its the search page and
  * on the instant search mutation observer (instantSearchMutationObserver) to hide the MS results box if it's
  * not a general search (e.g. news search)
  */
  if(!isInstantSearch && generalResultsPageIsDisplayedForNonInstantSearch()){
    showMSresultsBox()
  }
  /*****
  * Gonna do computedMsSidebarIconTop as a constant rather than computed as it wont change and
  * still seems to work ok even if the page is zoomed in.
  */
  // const computedMsSidebarIconTop = msSidebarIcon.getBoundingClientRect().top + scrollY
  const computedMsSidebarIconTop = 167

  setUpMSresultsBoxIcon(computedMsSidebarIconTop)

  if(showingOnLeft()){
    msResultsBoxElem.classList.add('msResultsBoxShowOnLeft')
  }

  documentClientWidth = document.documentElement.clientWidth
  /*****
  * We show the MS results box as a tab on load if:
  *   1: They have it set in the extension options to show the MS results box on the left - we show as a
  *   tab so that it doesn't obscure the search engine results.
  *   2: They have it set in the extension options to show the MS results box on the right and they do not
  *   have it set in the extension options to Autoexpand the results box.
  *   3: They have it set in the extension options to show the MS results box on the right, but the width
  *   of the page is too small to show the MS results box without obscuring the search engine results.
  *     The minimum width we want the MS results box to have is 490px.
  */
  if(shouldShowMSresultsBoxAsTabOnLoad()){
    msResultsBoxElem.classList.add('msResultsBoxShowTabOnly')
  }
  else{
    setMSresultsBoxWidth()
  }

  setMSresultsBoxHeight($('#search'))
  /*****
  * Event listeners for MS results box.
  */
  resultsBoxSideBar.addEventListener('click', toggleShowMSresultBoxAsTab)
  window.addEventListener('resize', debounce(windowResizeHandler, 150))

  document.body.appendChild(msResultsBoxElem)
}

function showingOnLeft(){
  return getSetting('msResultsBox_Position') === 'left'
}

function shouldShowMSresultsBoxAsTabOnLoad(){
  return showingOnLeft() || !getSetting('msResultsBox_AutoExpand') || (documentClientWidth - centerColWidth) < minimumMSresultsBoxWidth
}

/*****
* For setting the MS results box width, if the browser window is wide enough, show it on the right of the
* search engine results, otherwise, let it show on top of the search engine results.
*/
function setMSresultsBoxWidth(){
  /*****
  * #center_col is the element we don't want to obescure (if the browser is wide enough and it is shown on the right).
  * It's width is 632px and it's left-margin is 150px, plus a bit of margin on the right - 55px.
  * documentClientWidth (aka document.documentElement.clientWidth) gets us the browser page width without the
  * scrollbar interfering.
  * If we are showing the MS results box on the left, have the width be the width of the #center_col.
  */
  const widthAvailableForMSresultsBox = documentClientWidth - centerColWidth

  if(widthAvailableForMSresultsBox < minimumMSresultsBoxWidth){
    msResultsBoxElem.style.width = `initial`
  }
  else{
    msResultsBoxElem.style.width = `${ widthAvailableForMSresultsBox }px`
  }
}

/*****
* This if for clicking on the tab and for using the keyboard shortcut.
*/
function toggleShowMSresultBoxAsTab(){
  msResultsBoxElem.classList.toggle('msResultsBoxShowTabOnly')
  if(!showingOnLeft() && !msResultsBoxElem.classList.contains('msResultsBoxShowTabOnly')){
    setMSresultsBoxWidth()
  }
}

/*****
* Change the width of the MS results box if the user resizes the browser window.
*/
function windowResizeHandler(){
  if(showingOnLeft()){
    return
  }
  documentClientWidth = document.documentElement.clientWidth
  /*****
  * Only update the width of the MS results box on resize if it is currently shown in full
  * and not just as a tab.
  */
  if(!msResultsBoxElem.classList.contains('msResultsBoxShowTabOnly')){
    setMSresultsBoxWidth()
  }
}

/*****
* Note: we also call setMSresultsBoxHeight() in the mutation observer handler in googleSearch_ContentScript
* (for instant search) after new search engine results have been inserted as that could change the height of the page.
*/
function setMSresultsBoxHeight(searchElement){
  /*****
  * On DOMContentLoaded (for instant search) the searchElement is not yet there so fall back to a height of
  * calc(100vh - 166px - 84px - 20px).
  *
  * If the search engine has no results, the no results message isn't put in to the #search
  * element, it is put in to another element, which means the #search element has a height of 0, so when it is 0,
  * also fall back to calc(100vh - 166px - 84px - 20px).
  *
  * So there are two conditions here:
  *   1 - the searchElement is not yet available (searchElement is null/undefined).
  *   2 - the searchElement has a .clientHeight of 0.
  *
  * Note: the calc height is a bit of a guess, but should be ok for most occasions. It is
  * 100vh minus the bottom (aka .getBoundingClientRect().bottom) of the '#appbar' element (which is 166) minus
  * the '#fbar' .offsetHeight (which is about 84) minus a little bit of padding (20px) for the bottom.
  * The calc seems to work ok with the page zoomed in too.
  *
  * Re-setting the MS results box height on each new instant search may seem a little inefficient, but we are doing
  * it for simplicity, otherwise we would need to insert the MS results box in to one of the #search elements parents
  * and make sure to insert it after the first search engine results had been inserted into the page (for instant search)
  * on page load. Also, a lot of the page dom is removed and recreated/inserted when the user clicks the back/forward
  * browser buttons (with instant search), so we would have to keep recreating/re-inserting the MS results box.
  *
  * Also, in the event that there is only say 1-2 search engine results, the #search element height is not really
  * enough for the MS results box to look decent, so if the #search element height is less than 360px, fall back
  * to the 'calc(100vh - 166px - 84px - 20px)'
  * const msResultsBoxFallbackHeight = 'calc(100vh - 166px - 84px - 20px)'
  * const msResultsBoxMinimumHeight = 360
  */
  let msResultsBoxNewHeight = msResultsBoxFallbackHeight

  if(searchElement){
    const searchElementClientHeight = searchElement.clientHeight

    if(searchElementClientHeight !== 0 && searchElementClientHeight > msResultsBoxMinimumHeight){
      msResultsBoxNewHeight = `${ searchElementClientHeight }px`
    }
  }
  /*****
  * If the old height value is the same as the new height value, just leave it.
  */
  if(msResultsBoxOldHeight !== msResultsBoxNewHeight){
    msResultsBoxOldHeight = msResultsBoxNewHeight
    msResultsBoxElem.style.height = msResultsBoxNewHeight
  }
}

function instantSearchToggleMSresultsBoxVisibility() {
  /*****
  * We just check if the first search nav element (All) has the class that indicates it's selected.
  *
  * Note: we don't have to check if it's a search page, as we have a css rule that hides the MS results
  * box if the body element has a class of 'hp'
  *
  */
  const allSearchNavElem = $('#hdtb-msb>div>div')

  if(allSearchNavElem && allSearchNavElem.classList.contains('hdtb-msel')){
    showMSresultsBox()
  }
  else{
    hideMSresultsBox()
  }
}

export {
  setUpMSresultsBoxForGoogle,
  setMSresultsBoxHeight,
  instantSearchToggleMSresultsBoxVisibility,
}

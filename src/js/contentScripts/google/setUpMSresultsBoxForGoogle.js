import {
  msResultsBoxElem,
  resultsBoxSideBar,
  hideMSresultsBox,
  createMSresultsBox,
  setUpMSresultsBoxIcon
} from '../markSearchResultsBox'
import { getSetting } from '../CS_utils'
import { $ } from '../../utils'

import debounce from 'lodash.debounce'
import Velocity from 'velocity-animate'

let msResultsBoxOldHeight
let documentClientWidth
let msResultsBoxShownAsTab = false

function setUpMSresultsBoxForGoogle(onSearchPage){
  createMSresultsBox()
  /*****
  * The msResultsBox_google class is for google specific styles for the MS results box.
  */
  msResultsBoxElem.classList.add('msResultsBox_google')
  /*****
  * If the search page is displayed and we're on instant search, hide the MS results
  * box for the moment.
  */
  if(onSearchPage){
    hideMSresultsBox()
  }
  /*
  * Gonna do computedMsSidebarIconTop as a constant rather than computed as it wont change and
  * still seems to work ok even if the page is zoomed in.
  */
  // const computedMsSidebarIconTop = msSidebarIcon.getBoundingClientRect().top + scrollY
  const computedMsSidebarIconTop = 167

  setUpMSresultsBoxIcon(computedMsSidebarIconTop)

  documentClientWidth = document.documentElement.clientWidth
  /*****
  * We show the MS results box as a tab on load if:
  *   1: They have it set in the extension options to show the MS results box on the left - we show as a
  *   tab so that it doesn't obscure the search engine results.
  *   2: They do not have it set in the extension options to Autoexpand the results box.
  *   3: They have it set in the extension options to show the MS results box on the left, but the width
  *   of the page is too small to show the MS results box without obscuring the search engine results.
  *     The minimum width we want the MS results box to have is 490px.
  */
  const animate = false
  setMSresultsBoxWidth(animate, shouldShowMSresultsBoxAsTabOnLoad())

  setMSresultsBoxHeight($('#search'))
  /*****
  * Event listeners for MS results box.
  */
  resultsBoxSideBar.addEventListener('click', toggleShowMSresultBoxAsTab)
  window.addEventListener('resize', debounce(windowResizeHandler, 150))

  document.body.appendChild(msResultsBoxElem)
}

function shouldShowMSresultsBoxAsTabOnLoad(){
  const showAsTab = getSetting('msResultsBox_Position') === 'left' ||
      !getSetting('msResultsBox_AutoExpand') ||
      (documentClientWidth - (632 + 140 + 55)) < 490;   // eslint-disable-line semi

  return showAsTab
}

/*****
* For setting the MS results box width, if the browser window is wide enough, show it on the right of the
* search engine results, otherwise, let show on top of the search engine results.
*/
function setMSresultsBoxWidth(animate, showAsTab){
  /*****
  * #center_col is the element we don't want to obescure. It's width is 632px and it's left-margin is 150px, plus a
  * bit of margin on the right - 55px.
  * documentClientWidth (aka document.documentElement.clientWidth) gets us the browser page width without the
  * scrollbar interfering.
  * If we want to show the MS results box as a tab, we set the width to 40px, which is the width of the
  * resultsBoxSideBar.
  */
  let widthAvailableForMSresultsBox = documentClientWidth - (632 + 140 + 55)
  msResultsBoxShownAsTab = true

  if(showAsTab){
    widthAvailableForMSresultsBox = 40
  }

  if(!showAsTab && widthAvailableForMSresultsBox < 490){
    msResultsBoxElem.style.width = `initial`
  }
  else{
    if(animate){
      Velocity(msResultsBoxElem, { width: widthAvailableForMSresultsBox }, { duration: 500 })
    }
    else{
      console.log('else')
      msResultsBoxElem.style.width = `${ widthAvailableForMSresultsBox }px`
    }
  }
}

/*****
* This if for clicking on the tab and for using the keyboard shortcut.
*/
function toggleShowMSresultBoxAsTab(){
  const animate = true
  const showAsTab = !msResultsBoxShownAsTab
  setMSresultsBoxWidth(animate, showAsTab)
}

/*****
* Change the width of the MS results box if the user resizes the browser window.
*/
function windowResizeHandler(){
  documentClientWidth = document.documentElement.clientWidth
  /*****
  * Only update the width of the MS results box on resize if it is currently shown in full
  * and not just as a tab.
  */
  if(!msResultsBoxShownAsTab){
    const animate = true
    setMSresultsBoxWidth(animate)
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
  */
  let msResultsBoxNewHeight = 'calc(100vh - 166px - 84px - 20px)'

  if(searchElement){
    const searchElementClientHeight = searchElement.clientHeight
    console.log('searchElementClientHeight', searchElementClientHeight)
    if(searchElementClientHeight !== 0 && searchElementClientHeight > 360){
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

export {
  setUpMSresultsBoxForGoogle,
  setMSresultsBoxHeight,
}

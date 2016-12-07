import { extensionSettings } from './googleSearch_ContentScript'
import { setMSiconClass, getAddedResultNodes } from './googleSearchCSutils'
import { $ } from '../../utils'

let msResultsBoxResultsContainer
let msResultsBoxElem
let resElement
let observer

/*****
* setMSresultsBoxHeight() is also used in renderMarkSearchResults because when we insert
* MS results into the page, it changes the height of the #res element, so we need to
* re-set the msResultsBoxElem height.
*/
function setMSresultsBoxHeight(){
  msResultsBoxElem.setAttribute('style', `height:${ resElement.clientHeight }px;`)
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

function instantSearchPageLoadMutationHandler(mutations){
  /*****
  * getAddedResultNodes finds a mutation that added stuff to the #search element, then returns
  * the addedNodes NodeList from that mutation if it's there (returns falsey if not).
  * Looking for the #search target seems to be the best option as the other mutation targets
  * don't seem that helpful. #search is not a bad one to check since it's a direct child of #res
  */
  if(getAddedResultNodes(mutations)){
    observer.disconnect()
    resElement = $('#res')
    setUpMSresultsBox()
  }
}

function initMSresultsBox(isInstantSearch){
  /*****
  * #res element isn't available yet on DOMContentLoaded when it's instant search,
  * so need to set an observer and wait. (we remove the observer once #res is available)
  * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
  */
  if(isInstantSearch){
    observer = new MutationObserver(instantSearchPageLoadMutationHandler)

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
  msResultsBoxResultsContainer
}

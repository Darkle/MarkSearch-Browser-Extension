import { extensionSettings } from './googleSearch_ContentScript'
import { setMSiconClass } from './googleSearchCSutils'
import { $ } from '../../utils'

let msResultsBoxResultsContainer
let msResultsBoxElem
let msResultsBoxOldHeight
let msResultsBoxTopStyleSet = false

function hideMSresultsBox(){
  msResultsBoxElem.classList.add('msResultsBoxHide')
}

function showMSresultsBox(){
  if(msResultsBoxElem.classList.contains('msResultsBoxHide')){
    msResultsBoxElem.classList.remove('msResultsBoxHide')
  }
}

function setMSResultsBoxTopStyle(){
  if(msResultsBoxTopStyleSet){
    return
  }

  const rcntElement = $('#rcnt')

  if(rcntElement){
    /*****
    * We're calculating instead of using a constant in case the user has zoomed in the page.
    * It's only set once per content script load so it shouldn't be too expenisve in terms of
    * layout re-calc.
    */
    msResultsBoxElem.style.top = `${ rcntElement.getBoundingClientRect().top }px`
    msResultsBoxTopStyleSet = true
  }
}

/*****
* We also call setMSresultsBoxHeight() in the mutation observer handler in googleSearch_ContentScript
* after new search engine results have been inserted as that could change the height of the page.
*/
function setMSresultsBoxHeight(searchElement){
  /*****
  * On DOMContentLoaded for instant search the searchElement is not yet there so fall back to a height of
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
  */

  let msResultsBoxNewHeight = 'calc(100vh - 166px - 84px - 20px)'

  if(searchElement){
    const searchElementClientHeight = searchElement.clientHeight
    if(searchElementClientHeight !== 0){
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

function setUpMSresultsBox(searchPageIsDisplayed){

  msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')

  setMSresultsBoxHeight($('#search'))
  /*****
  * Setting the MS results box top value as a constant seems to work ok even if the page is zoomed in.
  * So have set it to top: 169px in the css.
  */
  // setMSResultsBoxTopStyle()

  /*****
  * If the search page is displayed and we're on instant search, hide the MS results
  * box for the moment.
  */
  if(searchPageIsDisplayed){
    hideMSresultsBox()
  }

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

    document.body.appendChild(msResultsBoxElem)
  }
}

export {
  setUpMSresultsBox,
  setMSresultsBoxHeight,
  msResultsBoxResultsContainer,
  hideMSresultsBox,
  showMSresultsBox,
  setMSResultsBoxTopStyle,
}

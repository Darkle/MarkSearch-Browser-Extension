import { extensionSettings } from './googleSearch_ContentScript'
import { setMSiconClass } from './googleSearchCSutils'
import { $ } from '../../utils'

let msResultsBoxResultsContainer
let msResultsBoxElem
let msResultsBoxHeight

function hideMSresultsBox(){
  msResultsBoxElem.classList.add('msResultsBoxHide')
}

function showMSresultsBox(){
  if(msResultsBoxElem.classList.contains('msResultsBoxHide')){
    msResultsBoxElem.classList.remove('msResultsBoxHide')
  }
}

/*****
* We also call setMSresultsBoxHeight() in the mutation observer handler in googleSearch_ContentScript
* after new search engine results have been inserted as that could change the height of the page.
*/
function setMSresultsBoxHeight(searchElement){
  /*****
  * On DOMContentLoaded for instant search the searchElement is not yet there so fall
  * back to using 100vh.
  */
  const searchElementClientHeight = searchElement ? searchElement.clientHeight : 100
  const unit = searchElement ? 'px' : 'vh'
  console.log('setMSresultsBoxHeight')
  console.log('setMSresultsBoxHeight searchElement: ', searchElement)
  console.log('setMSresultsBoxHeight searchElementClientHeight: ', searchElementClientHeight)
  console.log('setMSresultsBoxHeight unit: ', unit)
  /*****
  * If the old height is the same as the new height, just leave it.
  */
  if(msResultsBoxHeight !== searchElementClientHeight){
    msResultsBoxHeight = searchElementClientHeight
    msResultsBoxElem.setAttribute('style', `height:${ msResultsBoxHeight }${ unit };`)
  }
}

function setUpMSresultsBox(searchPageIsDisplayed){

  msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')

  setMSresultsBoxHeight($('#search'))

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
  showMSresultsBox
}

import { getSetting, setMSiconClass } from './CS_utils'

let msResultsBoxResultsContainer
let msResultsBoxElem
let msSidebarIcon
let resultsBoxSideBar

function createMSresultsBox(){
  msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')

  resultsBoxSideBar = document.createElement('div')
  resultsBoxSideBar.setAttribute('id', 'msResultsBoxSidebar')
  msResultsBoxElem.appendChild(resultsBoxSideBar)

  msSidebarIcon = document.createElement('div')
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

  if(getSetting('msResultsBox_Position') === 'left'){
    msResultsBoxElem.classList.add('showMsResultsBoxOnLeft')
  }
  if(getSetting('msResultsBox_ShowViaAlwaysShow')){
    msResultsBoxElem.classList.add('forceShowMsResultsBox')
  }
}

function hideMSresultsBox(){
  msResultsBoxElem.classList.add('msResultsBoxHide')
}

function showMSresultsBox(){
  msResultsBoxElem.classList.remove('msResultsBoxHide')
}

function setUpMSresultsBoxIcon(topValue){
  /*****
  * We wanna have the MS icon in the search box be fixed and stay at the top of the results
  * box sidebar when the user scrolls down past the top of the results box.
  * We do this by using position:sticky in the css if the browser supports it, or by checking
  * manually on scroll where the icon is and and toggling a css class to make it position:fixed.
  * position:sticky is available in Firefox now and Chrome as of Jan 2017: http://bit.ly/2hCkkW4
  */
  if(!CSS.supports('position', 'sticky')){
    /*****
    * Need to check on load in case the page is already scrolled down past the top of the
    * results box.
    */
    setMSiconClass(msSidebarIcon, topValue)

    window.addEventListener('scroll',
      () => {
        setMSiconClass(msSidebarIcon, topValue)
      },
      {
        passive: true
      }
    )
  }
}

export {
  msResultsBoxElem,
  resultsBoxSideBar,
  createMSresultsBox,
  setUpMSresultsBoxIcon,
  msResultsBoxResultsContainer,
  hideMSresultsBox,
  showMSresultsBox,
}

import { setMSiconClass } from './googleSearchCSutils'
import { $ } from '../../utils'

let msResultsBoxResultsContainer

function setUpMSresultsBox(settings){
  /*****
  *
  */
  const msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')
  msResultsBoxElem.setAttribute('style', `height:${ $('#res').clientHeight }px;`)

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

  if(settings.msResultsBox_Position === 'left'){
    msResultsBoxElem.classList.add('showMsResultsBoxOnLeft')
  }
  if(settings.msResultsBox_ShowViaAlwaysShow){
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
  * Gonna do this as a constant rather than computed as it wont change and still seems to
  * work ok even if the page is zoomed in.
  */
  // const computedMsSidebarIconTop = msSidebarIcon.getBoundingClientRect().top + scrollY
  const computedMsSidebarIconTop = 167

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

export {
  setUpMSresultsBox,
  msResultsBoxResultsContainer
}

import { lunrStopwordList } from '../lunrStopwordFilter'
import { extensionSettings } from './googleSearch_ContentScript'

import { default as validatorUnescape } from 'validator/lib/unescape'
import DOMPurify from 'dompurify'
import stem from 'stem-porter'
// import truncate from 'lodash.truncate'

/*
Example MarkSearch result: 
  rank:-4.442214486214885,
  dateCreated:1464889272842,
  pageDomain:".boston.com",
  pageTitle:"Boston.com - Local breaking news, sports, and culture",
  pageDescription:"The news, sports, and culture that Boston really cares about right now - Boston.com",
  archiveLink:"https://archive.is/0mRK4",
  safeBrowsing:null,
  snippet:"...Boston this November These are the most popular nightclubs in Boston, according to check-in data Watch part two of Jimmy Kimmel’s hilarious ‘I Told My Kids I Ate All Their Halloween Candy’ video Watch Newton’s Priyanka Chopra practice her slo-mo ‘Baywatch’ run Watch the first trailer for Chris Evans and Jenny Slate’s ‘Gifted’ BOSTON GLOBE POLITICS BOSTON GLOBE Trump..."
*/

/*
Google Search Result Example (with some unnedded attrinutes removed/shortened):
<div class="g">
  <div class="rc" data-hveid="89" data-ved="0ahUKEwjvi9H77-PQAhVFjZQKHZo_D2wQFQhZKAAwDg">
    <h3 class="r">
      <a href="https://www.lonelyplanet.com/usa/boston" ">Boston - Lonely Planet</a>
    </h3>
    <div class="s">
      <div>
        <div class="f kv _SWb" style="white-space:nowrap">
          <cite class="_Rm">https://www.lonelyplanet.com/usa/<b>boston</b></cite>
          <div class="action-menu ab_ctl">
            <a class="_Fmb ab_button" href="#" id="am-b14" aria-label="Result details" aria-expanded="false" aria-haspopup="true" role="button">
              <span class="mn-dwn-arw"></span>
            </a>
            <div class="action-menu-panel ab_dropdown" role="menu" tabindex="-1">
              <ol>
                <li class="action-menu-item ab_dropdownitem" role="menuitem">
                  <a class="fl" href="https://webcache.googleusercontent.com/search" ">Cached</a>
                </li>
              </ol>
            </div>
          </div>
        </div>
        <span class="st">
          <em>Boston's</em> history recalls revolution and transformation, and still today it is among the country's most forward-thinking and barrier-breaking cities.
        </span>
      </div>
    </div>
  </div>
</div>
  */
//height="24" viewBox="0 0 24 24" width="24"
const svg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
            </svg>`

function createResultDescription(result, searchTerms){
  let resultDescription = ''
  if(result.snippet && result.snippet.length){
    /****
     * The snippet is set to -1 (on server side in search.js) which means it chooses
     * the column automatically and it usually picks a pageText snippet, however
     * the bm25 is set to boost the pageTitle & pageDescription, so if those are
     * selected, then the snippet ends up having no highlighting applied
     * to the tokens (search terms), so gonna manually add them if not already there
     * in the snippet.
     */
    const highlightOpeningSpan = '<em>'
    if(result.snippet.indexOf(highlightOpeningSpan) < 0){
      searchTerms
        .toLowerCase()
        .split(' ')
        .filter( searchTerm =>
          searchTerm.length > 1 && !searchTerm.startsWith('site:') && !lunrStopwordList[searchTerm]
        )
        .forEach( searchWord => {
          const stemmedSearchWord = stem(searchWord)
          const regex = new RegExp(`(${ stemmedSearchWord }[a-z]*)`, 'gi')
          const replacement = `${ highlightOpeningSpan }$1</em>`
          result.snippet = result.snippet.replace(regex, replacement)
        })
    }
    resultDescription = result.snippet
  }
  /****
   * Fall back to showing the pageDescription in case a snippet isn't
   * generated.
   */
  else if(result.pageDescription){
    resultDescription = result.pageDescription
  }
  /*****
  * Google's result descriptions are usually no more than 300 charachters & usually less than
  * 200 characters (about two lines). The MS descriptions are a bit longer and look a bit odd,
  * so chop off at 250 characters.
  * Using lodash.truncate so dont chop of word halfway through.
  * If it's for the MS results box, don't trim
  */
  // if(!resultIsForForMSresultsBox){
  //   resultDescription = truncate(resultDescription.trim(), {length: 250, separator: ' '})
  // }
  return resultDescription
}

function createMSresultElements(result, index, searchTerms){

  const mainResultContainer = document.createElement('div')
  mainResultContainer.setAttribute('class', `g MSresultsBoxResult MSresultsBoxResult_${ index + 1 }`)

  const resultLinkContainer = document.createElement('div')
  resultLinkContainer.setAttribute('class', 'rc')
  mainResultContainer.appendChild(resultLinkContainer)

  const resultLinkHeader = document.createElement('h3')
  resultLinkHeader.setAttribute('class', 'r')
  resultLinkContainer.appendChild(resultLinkHeader)

  const resultLink = document.createElement('a')
  resultLink.setAttribute('href', result.pageUrl)
  resultLink.setAttribute('class', 'MSresultLink')
  /*****
   * If there's no pageTitle text, then just use the page url
   */
  let resultLinkTextContent = result.pageUrl
  if(typeof result.pageTitle === 'string'){
    const pageTitleTrimmed = result.pageTitle.trim()
    if(pageTitleTrimmed.length > 0){
      resultLinkTextContent = pageTitleTrimmed
    }
  }
  /****
   * unescape should be ok here as we are using textContent and not innerHTML
   */
  resultLink.textContent = validatorUnescape(resultLinkTextContent)

  if(extensionSettings.msResultsPrebrowsing){
    if(index === 0){
      resultLink.setAttribute('rel', 'preconnect')
    }
    if(index === 1){
      resultLink.setAttribute('rel', 'dns-prefetch')
    }
  }
  resultLinkHeader.appendChild(resultLink)

  const resultDetailsAndDescription = document.createElement('div')
  resultDetailsAndDescription.setAttribute('class', `s MSresultDetailsAndDescription`)
  mainResultContainer.appendChild(resultDetailsAndDescription)

  const resultDetailsAndDescriptionInnerContainer = document.createElement('div')
  resultDetailsAndDescription.appendChild(resultDetailsAndDescriptionInnerContainer)

  const resultDetails = document.createElement('div')
  resultDetails.setAttribute('class', `f kv _SWb MSresultDetails`)
  resultDetailsAndDescriptionInnerContainer.appendChild(resultDetails)

  const resultCite = document.createElement('cite')
  resultCite.setAttribute('class', `_Rm MSresultCite`)
  /*****
  * 86 characters is about the longest the url can be befor it gets too big.
  */
  resultCite.textContent = result.pageUrl.slice(0, 86)
  resultDetails.appendChild(resultCite)

  if(result.archiveLink){
    const archiveLinkContainer = document.createElement('div')
    archiveLinkContainer.setAttribute('class', 'action-menu ab_ctl MSarchiveLinkContainer')
    resultDetails.appendChild(archiveLinkContainer)

    const archiveLink = document.createElement('a')
    archiveLink.setAttribute('href', result.archiveLink)
    archiveLink.setAttribute('class', 'MSarchiveLink')
    archiveLink.setAttribute('title', 'Archive Link')
    archiveLink.setAttribute('target', '_blank')
    /*****
    * http://bit.ly/2h5Vain
    */
    archiveLink.setAttribute('rel', 'noopener noreferrer')
    archiveLink.innerHTML = svg
    archiveLinkContainer.appendChild(archiveLink)
  }

  const resultDescription = document.createElement('span')
  resultDescription.setAttribute('class', `st MSresultDescription`)
  const description = createResultDescription(result, searchTerms)
  resultDescription.innerHTML = DOMPurify.sanitize(description)
  resultDetailsAndDescriptionInnerContainer.appendChild(resultDescription)

  return mainResultContainer
}

export {
  createMSresultElements
}

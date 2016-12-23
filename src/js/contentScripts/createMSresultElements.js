import { lunrStopwordList } from './lunrStopwordFilter'
import { getSetting } from './CS_utils'

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
    const highlightOpeningSpan = '<span class="searchHighlight">'
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
          const replacement = `${ highlightOpeningSpan }$1</span>`
          result.snippet = result.snippet.replace(regex, replacement)
        })
    }
    /*****
    * The preceding ellipse (...) for the snippets doesn't look as good in the results box as it does on the MarkSearch
    * server search page, so gonna remove it if the first letter is a capital letter.
    * Start of the snippet could be one of the following:
    *    1. `A`
    *    2. `a`
    *    3. `<span class="searchHighlight">A`
    *    4. `<span class="searchHighlight">a`
    *    5. `...A`
    *    6. `...a`
    *    7. `...<span class="searchHighlight">A`
    *    8. `...<span class="searchHighlight">a`
    */
    let snippetTestCopy = result.snippet
    /*****
    * Remove the preceding elipse and/or opening span tag so we can test if the first letter is a capital letter.
    */
    if(snippetTestCopy.startsWith('...')){
      snippetTestCopy = snippetTestCopy.slice(3)
    }
    if(snippetTestCopy.startsWith('<span class="searchHighlight">')){
      snippetTestCopy = snippetTestCopy.slice(30)
    }

    if(snippetTestCopy[0] === snippetTestCopy[0].toUpperCase()){
      result.snippet = result.snippet.slice(3)
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

function createResultLinkText({pageUrl, pageTitle}){
  /*****
   * If there's no pageTitle text, then just use the page url
   */
  let resultLinkTextContent = pageUrl
  if(typeof pageTitle === 'string'){
    const pageTitleTrimmed = pageTitle.trim()
    if(pageTitleTrimmed.length > 0){
      resultLinkTextContent = pageTitleTrimmed
    }
  }
  return resultLinkTextContent
}

function setPreBrowsing(index, resultLink){
  if(getSetting('msResultsPrebrowsing')){
    if(index === 0){
      resultLink.setAttribute('rel', 'preconnect')
    }
    if(index === 1){
      resultLink.setAttribute('rel', 'dns-prefetch')
    }
  }
}

function createMSresultElements(result, index, searchTerms){

  const mainResultContainer = document.createElement('div')
  mainResultContainer.setAttribute('class', `MSresultsBoxResult MSresultsBoxResultNumber_${ index + 1 }`)

  const resultLink = document.createElement('a')
  resultLink.setAttribute('href', result.pageUrl)
  resultLink.setAttribute('class', 'MSresultLink')
  /****
   * unescape should be ok here as we are using textContent and not innerHTML
   */
  resultLink.textContent = validatorUnescape(createResultLinkText(result))
  setPreBrowsing(index, resultLink)
  mainResultContainer.appendChild(resultLink)

  const resultMetaDataContainer = document.createElement('div')
  resultMetaDataContainer.setAttribute('class', 'MSresultMetaDataContainer')
  mainResultContainer.appendChild(resultMetaDataContainer)

  const resultUrlText = document.createElement('div')
  resultUrlText.textContent = result.pageUrl
  resultUrlText.setAttribute('class', 'MSresultUrlText')
  resultMetaDataContainer.appendChild(resultUrlText)

  if(result.archiveLink){
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
    resultMetaDataContainer.appendChild(archiveLink)
  }

  const resultDescription = document.createElement('div')
  resultDescription.setAttribute('class', `MSresultDescription`)

  const description = createResultDescription(result, searchTerms)
  resultDescription.innerHTML = DOMPurify.sanitize(description)

  mainResultContainer.appendChild(resultDescription)

  return mainResultContainer
}

export {
  createMSresultElements
}

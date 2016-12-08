
import { lunrStopwordList } from '../lunrStopwordFilter'
import { extensionSettings } from './googleSearch_ContentScript'

import { default as validatorUnescape } from 'validator/lib/unescape'
import DOMPurify from 'dompurify'
import stem from 'stem-porter'

/*
Example result:
  archiveLink: "https://archive.is/qHKPe"
  dateCreated: 1469506666578
  pageDescription: "The Age has the latest local news on Melbourne, Victoria. Read National News from Australia, World News, Business News and Breaking News stories."
  pageDomain: "theage.com.au"
  pageTitle: "Latest &amp; Breaking News Melbourne, Victoria | The Age"
  pageUrl: "http://www.theage.com.au/"
  rank:-8.023295618319
  safeBrowsing: null
  snippet:"...CARS F
 */

function createMSresultElements(result, index, searchTerms){
  const resultDiv = document.createElement('div')
  resultDiv.setAttribute('id', `marksearchResultsBoxResult_${ index + 1 }`)
  resultDiv.setAttribute('class', 'marksearchResultsBoxResult')

  const mainDetails = document.createElement('div')
  mainDetails.className = 'mainDetails'
  resultDiv.appendChild(mainDetails)

  const mainResultLink = document.createElement('div')
  mainResultLink.className = 'mainResultLink'
  mainDetails.appendChild(mainResultLink)

  const resultLink = document.createElement('a')
  resultLink.setAttribute('href', result.pageUrl)
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
  mainResultLink.appendChild(resultLink)

  const resultUrlText = document.createElement('div')
  resultUrlText.className = 'resultUrlText'
  resultUrlText.textContent = result.pageUrl
  mainDetails.appendChild(resultUrlText)

  const description = document.createElement('p')
  description.className = 'description'
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
  description.innerHTML = DOMPurify.sanitize(resultDescription.trim())
  mainDetails.appendChild(description)

  const metaIconsContainer = document.createElement('div')
  metaIconsContainer.className = 'metaIconsContainer'
  resultDiv.appendChild(metaIconsContainer)

  const metaIcons = document.createElement('div')
  metaIcons.className = 'metaIcons'
  metaIconsContainer.appendChild(metaIcons)

  if(result.archiveLink){
    const metaIconArchive = document.createElement('a')
    metaIconArchive.setAttribute('href', result.archiveLink)
    metaIconArchive.setAttribute('title', 'Archive Link')
    // metaIconArchive.setAttribute('data-pt-title', 'Archive Link')
    //metaIconArchive.setAttribute('data-pt-gravity', 'bottom 0 3')
    metaIconArchive.setAttribute('target', '_blank')
    metaIconArchive.setAttribute('rel', 'noopener')
    metaIconArchive.className = 'material-icons protip'
    metaIconArchive.textContent = 'account_balance'
    metaIcons.appendChild(metaIconArchive)
  }

  return resultDiv
}

export {
  createMSresultElements
}

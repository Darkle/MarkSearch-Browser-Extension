
import { validate as validatePageData } from 'schema-inspector'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'
import { pageDataSchema } from './pageDataSchema'

/*****
* @param {Object} pageData - The data object send from the page
* @param {string} pageData.pageTitle - The page title text returned from calling document.title.
* @param {string} pageData.pageText - The page text returned from calling document.body.innerText.
* @param {string} pageData.pageDescription - The page description returned from querying a bunch of elements.
* @param {string} pageData.url - The page location url returned from calling window.location.href.
* Note: every pageData property can be an empty string, except for the pageData.url property; it must be a valid url.
*/
function savePageToMarkSearch(pageData){
  return new Promise( (resolve, reject) => {
    const validationResult = validatePageData(pageDataSchema, pageData)
    if(!validationResult.valid){
      const errorMessage = `Error, pageData did not pass validation.
                          Error(s): ${ validationResult.format() }`
      return reject(new Error(errorMessage))
    }

    const pageTitle = `pageTitle=${ encodeURIComponent(pageData.pageTitle) }`
    const pageText = `&pageText=${ encodeURIComponent(pageData.pageText) }`
    const pageDescription = `&pageDescription=${ encodeURIComponent(pageData.pageDescription) }`
    const body = pageTitle + pageText + pageDescription
    const fetchUrl = `${ marksearchServerAddress }/api/add/${ encodeURIComponent(pageData.url) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': marksearchApiToken,
        'Content-type': 'application/x-www-form-urlencoded'
      }),
      method: 'POST',
      body
    })

    fetch(request)
      .then( ({ status }) => {
        const statusIs200 = (status === 200)
        if(!statusIs200){
          throw new Error(`There was an error in the fetch request in savePageToMarkSearch.
                          Status code returned from the MarkSearch server was not 200.`)
        }
        resolve(statusIs200)
      })
      .catch(reject)
  })
}

export { savePageToMarkSearch }

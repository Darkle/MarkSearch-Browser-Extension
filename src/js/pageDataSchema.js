import { isWebUri } from 'valid-url'

/*****
* using window.location.href in the savePageAndNotify_ContentScript, which seems to add the trailing
* slash to a domain with not path, so don't have to do that here.
*/

const pageDataSchema = {
  type: 'object',
  strict: true,
  properties: {
    pageTitle: {
      type: 'string'
    },
    pageText: {
      type: 'string'
    },
    pageDescription: {
      type: 'string'
    },
    url: {
      type: 'string',
      minLength: 4,
      maxLength: 2000,
      exec(scheme, post) {
        if(!isWebUri(post)){
          this.report('url passed to pageDataSchema.js is not a valid web url!')
        }
      }
    }
  }
}

export { pageDataSchema }

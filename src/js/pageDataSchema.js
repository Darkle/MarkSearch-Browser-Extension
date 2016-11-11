import { Type, Presence } from 'sculp'
import { isWebUri } from 'valid-url'

/*****
* using window.location.href in the savePageAndNotify_ContentScript, which seems to add the trailing
* slash to a domain with not path, so don't have to do that here.
*/

const pageDataSchema = {
  type: 'object',
  properties: {
    pageTitle: {
      type: 'Type.STRING',
      $presence: Presence.REQUIRED
    },
    pageText: {
      type: Type.STRING,
      $presence: Presence.REQUIRED
    },
    pageDescription: {
      type: Type.STRING,
      $presence: Presence.REQUIRED
    },
    url: {
      type: Type.STRING,
      $lengthmin: 4,
      $presence: Presence.REQUIRED,
      // $regexp: new RegExp('^(http|https)://', 'i'),
      $lengthmax: 2000,
      $custom: fa => !isWebUri(fa()) ? undefined : 'String is not a valid web url' // eslint-disable-line
    }
  }
}

export { pageDataSchema }

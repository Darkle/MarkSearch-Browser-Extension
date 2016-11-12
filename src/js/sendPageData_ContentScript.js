
let description = ''
const descriptionElem = document
                          .querySelector(
                            'meta[name="description"],'+
                            'meta[name="Description"],'+
                            'meta[name="DESCRIPTION"],'+
                            'meta[property="og:description"]'
                          )
const keywordsElem = document
                      .querySelector(
                        'meta[name="keywords"],'+
                        'meta[name="Keywords"],'+
                        'meta[name="KEYWORDS"],'+
                        'meta[property="og:keywords"]'
                      )
if(descriptionElem && descriptionElem.hasAttribute('content')){
  description = descriptionElem.getAttribute('content')
}
else if(keywordsElem && keywordsElem.hasAttribute('content')){
  description = keywordsElem.getAttribute('content')
}

/*****
* Choosing to use innerText for pageText because it excludes script and style tags
* & respects new lines created by <br> and block level elements:
* An example: <div>space</div>test1<div>test2</div> - with textContent, the returned
* text would be "spacetest1test2", but with innerText it's "space\ntest1\ntest2" -
* (note: we collapse the whitespace later on (in addPage.js on the MarkSearch server) which turns the \n into a space).
* http://mzl.la/1RSTO9T
* http://bit.ly/1KkKA3N
*
* I think I'm ok with innerText not getting the text in elements that have
* display:none or visibility: hidden if it means we get space in between block level elements.
* Since searching the text is key, there's probably likely to be more issues with
* block level element's text being concatinated with no space between them than with missing
* text that is supposed to be hidden.
*/

chrome.runtime.sendMessage(
  {
    pageTitle: document.title,
    pageText: document.body.innerText,
    pageDescription: description,
    url: window.location.href
  }
)

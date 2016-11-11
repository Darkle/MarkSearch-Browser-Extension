
import '../styles/savePageAndNotify_ContentScript.styl'

function showNotification(pageSuccessfullySaved){
  console.log('pageSuccessfullySaved')
  console.log(pageSuccessfullySaved)
}

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

chrome.runtime.sendMessage(
  {
    pageTitle: document.title,
    pageText: document.body.innerText,
    pageDescription: description,
    url: window.location.href
  },
  ({pageSaved}) => showNotification(pageSaved)
)

chrome.runtime.onMessage.addListener( ({pageSaved}) => {
  if(typeof pageSaved === 'undefined'){
    return
  }
  showNotification(pageSaved)
})

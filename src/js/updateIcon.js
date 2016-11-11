
function updateIcon(pageIsSavedInMarkSearch, tabId){
  let title = 'Save To MarkSearch'
  let text = ''
  if(pageIsSavedInMarkSearch){
    title = 'Page Saved To MarkSearch'
    text = 'Saved'
  }
  chrome.browserAction.setTitle({title, tabId})
  chrome.browserAction.setBadgeText({text, tabId})
}

export { updateIcon }

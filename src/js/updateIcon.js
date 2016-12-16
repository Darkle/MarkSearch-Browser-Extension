
function updateIcon(pageIsSavedInMarkSearch, tabId){
  const title = pageIsSavedInMarkSearch ? 'Page Saved To MarkSearch' : 'Save To MarkSearch'
  const text = pageIsSavedInMarkSearch ? 'Saved' : ''
  
  chrome.browserAction.setTitle({title, tabId})
  chrome.browserAction.setBadgeText({text, tabId})
}

export { updateIcon }

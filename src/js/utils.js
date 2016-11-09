function isBookmarkable(url) {
  const protocol = new URL(url).protocol
  if(protocol === 'http:' || protocol === 'https:'){
    return true
  }
  return false
}

export { isBookmarkable }

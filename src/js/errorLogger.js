
function isTabIdErrorInProduction(error){
  return global__isProduction && error.message && error.message === 'tabId is undefined in checkIfPageIsSaved'
}

function errorLogger(error){
  /*****
  * getCurrentTabUrl_InvalidUrl is a property attached to the new Error object created when a url is determined to
  * be an invalid web url. It is created in checkIfValidUrl in utils.js. checkIfValidUrl is called by checkIfPageIsSaved.
  * Don't need to log those errors as just saying that's it's an invalid url to check.
  * Also not gonna log tabId errors in production to prevent spamming the console.
  */
  if(!error || error.getCurrentTabUrl_InvalidUrl || isTabIdErrorInProduction(error)){
    return
  }
  if(error.stack){
    return console.error(error.stack)
  }
  if(error.message){
    return console.error(error.message)
  }
}

export { errorLogger }


function errorLogger(error){
  /*****
  * getCurrentTabUrl_InvalidUrl is a property attached to the new Error object created when a url is determined to
  * be an invalid web url. It is created in checkIfValidUrl in utils.js. checkIfValidUrl is called by checkIfPageIsSaved.
  * Don't need to log those errors as just saying that's it's an invalid url to check.
  */
  if(!error || error.getCurrentTabUrl_InvalidUrl){
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

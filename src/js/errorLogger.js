
function errorLogger(error){
  if(!error){
    /*****
    * Gonna log it even if it's undefined so know an error is occurring.
    */
    return console.error(error)
  }
  /*****
  * getCurrentTabUrl_InvalidUrl is a property attached to the new Error object created when a url is determined to
  * be an invalid web url. It is created in checkIfValidUrl in utils.js. checkIfValidUrl is called by checkIfPageIsSaved.
  * Don't need to log those errors as just saying that's it's an invalid url to check. 
  */
  if(error.getCurrentTabUrl_InvalidUrl){
    return
  }
  if(!error.stack){
    console.error(error.message)
  }
  else{
    console.error(error.stack)
  }
}

export { errorLogger }

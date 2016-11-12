
function errorLogger(error){
  if(!error){
    /*****
    * Gonna log it even if it's undefined so know an error is occurring.
    */
    return console.error(error)
  }
  if(error.message === 'getCurrentTabUrl invalid url'){
    /*****
    * 'getCurrentTabUrl invalid url' occurs when checkIfPageIsSaved calls checkIfValidUrl and it's not a valid url.
    * Don't need to log these errors as just saying that's it's an invalid url to check. checkIfPageIsSaved doesn't
    * continue if checkIfValidUrl rejects the promise.
    */
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

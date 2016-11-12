
function errorLogger(error){
  if(!error){
    /*****
    * Gonna log it even if it's undefined so know an error is occurring.
    */
    return console.error(error)
  }
  if(error.message === 'getCurrentTabUrl invalid url'){
    /*****
    * 'getCurrentTabUrl invalid url' occurs when checkIfPageIsSaved calls getCurrentTabUrl and it's not a valid url.
    * Don't need to log these errors as they aren't really errors, just an invalid url. checkIfPageIsSaved doesn't
    * continue if getCurrentTabUrl rejects the promise.
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

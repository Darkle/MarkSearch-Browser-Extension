let marksearchServerAddress = null
let marksearchApiToken = null

function assignServerAddressAndToken(extensionTokenString){
  if(typeof extensionTokenString === 'string' && extensionTokenString.indexOf(',') > 1){
    const splitExtensionToken = extensionTokenString.split(',')
    marksearchServerAddress = splitExtensionToken[0]
    marksearchApiToken = splitExtensionToken[1]
  }
}

export { assignServerAddressAndToken, marksearchServerAddress, marksearchApiToken }

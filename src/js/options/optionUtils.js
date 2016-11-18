
function getOptionElementValue(optionElement){
  if(optionElement.matches('input[type="checkbox"], input[type="radio"]')){
    return optionElement.checked
  }
  if(optionElement.matches('input[type="number"]')){
    const numInputAsInteger = Number.parseInt(optionElement.value)
    if(!numInputAsInteger || numInputAsInteger < 1 ){
      return 1
    }
    return numInputAsInteger
  }
  return optionElement.value
}

export {
  getOptionElementValue
}

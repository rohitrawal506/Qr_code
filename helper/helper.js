EncodeBase64 = (data) => {
    console.log(data.toString())
    // Create buffer object, specifying utf8 as encoding
    let bufferObj = Buffer.from(data.toString(), "utf8");
    
    // Encode the Buffer as a base64 string
    let base64String = bufferObj.toString("base64");
    
    return base64String
}
DecodeBase64 = (data) => {
  
    // Create a buffer from the string
    let bufferObj = Buffer.from(data, "base64");
    
    // Encode the Buffer as a utf8 string
    let decodedString = bufferObj.toString("utf8");
    
    return Number(decodedString)
}

module.exports = { EncodeBase64, DecodeBase64};
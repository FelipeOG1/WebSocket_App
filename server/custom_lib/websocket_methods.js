const CONSTANTS=require('./websocket_constants')

const crypto=require('crypto');



//check the origin headers to see if are the correct ones
function checkOrigin(origin){
    return CONSTANTS.ALLOWED_ORIGINS.includes(origin)





}
// Check if all the required headers are aligned with RFC 6455 specifications
function check(socket,upgrade,connection,origin,method){
    if(upgrade && connection && origin && method){
        return true
    }else{

        const message='400 bad request. the HTTP headers do not comply with the RFC6455 spec.';
        const length=message.length;
        const response= 'HTTP/1.1 400 Bad Request\r\n' +
        'Content-Type: text/plain\r\n' +
        'Content-Length: ' + length + '\r\n' +
        '\r\n' + 
        message;
    
    
    socket.write(response);
    socket.end();
        
        
    }
}

// If all the headers are correct, send the corresponding response that aligns with RFC 6455


function CreateUpgradeHeaders(key){

    const secSocketKey=GenerateKey(key);

  

    const headers=['HTTP/1.1 101 Switching protocols','Upgrade: websocket','Connection: upgrade','Sec-WebSocket-Accept: '+ secSocketKey]

    const response=headers.join('\r\n')+ '\r\n\r\n'

    return response

  


}

// RFC 6455 establishes that the WebSocket key sent by the server needs to be hashed with SHA-1 and encoded in Base64

function GenerateKey(key){
    let webScoketKey=key+CONSTANTS.GUID;

    let hash=crypto.createHash('sha1');

    hash.update(webScoketKey);
    

    
    let hashedKey=hash.digest('base64');
    
    return hashedKey;



}


// XOR each byte of the payload using the corresponding 4 bytes of the masking key

function UnmaskPayload(maskedPayload,maskKey){


    for(let i=0;i<maskedPayload.length;i++){

        maskedPayload[i]=maskedPayload[i] ^ maskKey[i % 4]
    }



    return maskedPayload;
}


module.exports={


    checkOrigin,
    check,
    CreateUpgradeHeaders,
    UnmaskPayload
}
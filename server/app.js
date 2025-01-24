
const HTTP = require('http');


const CONSTANTS = require('./custom_lib/websocket_constants');
const FUNCTIONS = require('./custom_lib/websocket_methods');
const { flushCompileCache } = require('module');
const { inflate } = require('zlib');


const HTTP_SERVER = HTTP.createServer((req, res) => {
    
    res.writeHead(200);
    res.end('=');
});


HTTP_SERVER.listen(CONSTANTS.PORT, () => {
    console.log("The http server is listening on port " + CONSTANTS.PORT);
});

CONSTANTS.CUSTOM_ERRORS.forEach( errorEvent => {
    process.on(errorEvent, (err) => {
        console.log(`My code caught an error event: ${errorEvent}. Here's the error object`, err);
        // exit the process.
        process.exit(1);
    });
});


// Validate WebSocket upgrade request headers to ensure the client meets protocol requirements.


HTTP_SERVER.on('upgrade', (req, socket, head) => {
      // Grab the required request headers and compare them with the ones that should be
    const upgradeHeaderCheck = req.headers['upgrade'].toLowerCase() === CONSTANTS.UPGRADE;
    const connectionHeaderCheck = req.headers['connection'].toLowerCase() === CONSTANTS.CONNECTION;
    const methodCheck = req.method === CONSTANTS.METHOD;

   
    const origin = req.headers['origin'];
    const originCheck = FUNCTIONS.checkOrigin(origin);

        // Perform a final check that all request headers are okay. If they are, we want to proceed with the upgrade connection function.

    if (FUNCTIONS.check(socket, upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck)) {
        upgradeConnection(req, socket, head);
    };
});

function upgradeConnection(req, socket, head) {
    
    const clientKey = req.headers['sec-websocket-key'];
        // Generate response headers using the clientKey
    const headers = FUNCTIONS.CreateUpgradeHeaders(clientKey);
    socket.write(headers);
        // If successful, now it is a valid WebSocket connection and completes the handshake

    startWebSocketConnection(socket);
};

function startWebSocketConnection(socket) {

    const receiver=new WebSocketReceiver(socket)


    
    // Process incoming data chunks to extract headers, determine payload length, and unmask payload data.



    // If payload length exceeds 65,536 bytes, expect multiple chunks and process remaining data later.


    socket.on('data',(chunks)=>{

    

        receiver.processBuffer(chunks)      
        
        
 

        

        

     


    })


    socket.on('end',()=>{

        console.log('user disconected from the client')
    })

};




class WebSocketReceiver{
    #buffersArray = [];
    #bufferedBytesLength = 0;
    #taskLoop=false;
    #task=CONSTANTS.GET_INFO;
    #fin=false; // Indicates if the message is complete (true) or a fragment (false).
    #opcode=null; // Specifies the type of data received from the client, based on the opcode.
    #mask=false;  // Indicates if the payload data is masked (true) or not (false).
    #initialPayloadLength=0 ;//less than 126 bytes means that the data here is the actual size of the payload.
    #framePayloadLength=0; //keep track of the current frame to compare it with tha actual buffers array.
    #maxPayloadLength=1024 * 1024; //Users can only send 1MB in size or one million bits;

    #totalPayloadLength=0;
    #totalFrames=0;// there can be more than one frame
    #maskKey=Buffer.alloc(CONSTANTS.MASK_KEY_CONSUMSPTION); //hold the mask key if this one is set to one

    #fragments=[];



    constructor(socket){

        this._socket=socket

        
    };
    
    
    processBuffer(chunk){

        this.#buffersArray.push(chunk);
        this.#bufferedBytesLength+=chunk.length;


        this.#startTaskLoop();

        



    };


    #startTaskLoop(){
        this.#taskLoop=true;


        do{
            switch(this.#task){


                //Case Get info extract the first two bytes of each chunk to get the FIN code, the payload Length and the mask Key

                case CONSTANTS.GET_INFO:
                    this.#getInfo();

                    break;
                // Case Get length, use the payload length info extracted in the getInfo funcion to extract the payload length.
                case CONSTANTS.GET_LENGTH:
                    this.#getExtendedPayloadLength();

                    break;
                // Extract the next 4 bytes after the payload length to get the masking key
                case CONSTANTS.GET_MASK_KEY:

                this.#getMaskKey();

                break;
                //Case masking key we proceed to unmasked the payload data.
                case CONSTANTS.GET_PAYLOAD:

                this.#getPayload();

                break;

                case CONSTANTS.SEND_ECHO:
                    this.#sendEcho();

                    break;

                case CONSTANTS.GET_CLOSE_INFO:
                    this.#getCloseInfo();

               
                
            }


        }while(this.#taskLoop);



    };

    #getInfo(){

        if(this.#bufferedBytesLength < CONSTANTS.MINUMUM_SIZE){

            this.#taskLoop=false;
            return
        }
        const infoBuffer=this.#consumeHeaders(CONSTANTS.MINUMUM_SIZE);
        const firstByte=infoBuffer[0];
        const secondByte=infoBuffer[1];


        this.#fin = (firstByte & 0b10000000) === 0b10000000;
        this.#opcode=firstByte & 0b00001111;

        this.#mask=(secondByte & 0b10000000) === 0b10000000;
        this.#initialPayloadLength=secondByte & 0b01111111;



        //Every message coming from the client has to be masked.
        if (!this.#mask){

            throw new Error('Mask is not set to the client')
            
        }
        //if the payloadLength of the current frame is 125 or less, there is no need to process the extended payload length because theres any
        if(this.#initialPayloadLength<=CONSTANTS.SMALL_PAYLOAD_FLAG){

            this.#framePayloadLength=this.#initialPayloadLength;


            this.#processLength();


            return


       

            
            
        }




        //if payloadLength of the current frame is either 126 or 127 we want to get the extended payload length

            this.#task=CONSTANTS.GET_LENGTH;

         


        };

       
    
        //consume headers function is used to extract the info bytes and other crucial bytes like the masking key
   
    #consumeHeaders(minSize){

      
        this.#bufferedBytesLength-=minSize;


        if(minSize===this.#buffersArray[0].length){

            return this.#buffersArray[0].shift();
            
        }

        if(minSize<this.#buffersArray[0].length){
            
            const bufferInfo=this.#buffersArray[0].slice(0,minSize);
            this.#buffersArray[0]=this.#buffersArray[0].slice(minSize);
            
            return bufferInfo;
            
          
        }else{
            

            throw Error('You cannot extract more data froma a ws frame than the actual frame size');
        }


        

    };

    #getExtendedPayloadLength(){
        //Extract the next two bytes that contains the extended payload length

        // Case 126 we have to consume the next 2 bytes 
   

      
        if(this.#initialPayloadLength===CONSTANTS.MEDIUM_PAYLOAD_FLAG){

           let mediumPayloadBuffer=this.#consumeHeaders(CONSTANTS.MEDIUM_PAYLOAD_CONSUMSPTION);

           this.#framePayloadLength=mediumPayloadBuffer.readUInt16BE();


           this.#processLength();
           


            

        }else{

        //case 127 we have to consume the next 8 bytes.

        
         let LargePayloadBuffer=this.#consumeHeaders(CONSTANTS.LARGE_PAYLOAD_CONSUMPTION);
         let bigPayloadBuffer=LargePayloadBuffer.readBigUInt64BE();

         this.#framePayloadLength=Number(bigPayloadBuffer);

         this.#processLength();

            

          
        }






        



    };

    #processLength(){

        //Update the totalPayloadLength to get track of all the chunks of data 

        this.#totalPayloadLength+=this.#framePayloadLength;

        if (this.#totalPayloadLength>this.#maxPayloadLength){

            throw new Error('Max payload length capacity')
        }


        
        this.#task=CONSTANTS.GET_MASK_KEY;

        


    };




    #getMaskKey(){


        //consume the next 4 bytes to extract the masking key.


        this.#maskKey=this.#consumeHeaders(CONSTANTS.MASK_KEY_CONSUMSPTION);



        this.#task=CONSTANTS.GET_PAYLOAD;





    };

    #getPayload(){

        

        if(this.#bufferedBytesLength < this.#framePayloadLength){
        //if this trigers means that we have to wait for more chunks to be able to unmask the entire data.

           this.#taskLoop=false;

           return

        }

        


       this.#totalFrames+=1

       //extract the entire masked payload first
       let fullMaskedPayloadBuffer=this.#consumePayload(this.#framePayloadLength);

        //Once got the entire masked payload now unmasked with the unmaskPayload function
       let unmaskedPayload=FUNCTIONS.UnmaskPayload(fullMaskedPayloadBuffer,this.#maskKey)



       if(unmaskedPayload.length){

        this.#fragments.push(unmaskedPayload)


       }

       if(this.#opcode===CONSTANTS.OPCODE_CLOSE){

        this.#task=CONSTANTS.GET_CLOSE_INFO

        return
       }


       //if fin equal false, there is no more fragments meaning we completed to extract all the payload data

       if(!this.#fin){
        this.#task=CONSTANTS.GET_INFO
       
    
    }else{

        console.log('frames received: ' + " " + this.#totalFrames)

        console.log('total payload length' + " " + this.#totalPayloadLength)


        this.#task=CONSTANTS.SEND_ECHO

        

 


    }






    };


    //Consume payload initialize a buffer with a length of the payloadLength extracted with the getLengh function and then fill the buffer with the entire masked payload
    #consumePayload(payloadLength) {
        this.#bufferedBytesLength -= payloadLength;
        const payloadBuffer = Buffer.alloc(payloadLength);
        let bytesConsumed = 0;
    
        while(bytesConsumed < payloadLength) {
            const buff = this.#buffersArray[0];
            const bytesToRead = Math.min(payloadLength - bytesConsumed, buff.length);
            buff.copy(payloadBuffer, bytesConsumed, 0, bytesToRead);
            bytesConsumed += bytesToRead;
    
            if(bytesToRead < buff.length) {
                this.#buffersArray[0] = buff.slice(bytesToRead);
            } else {
                this.#buffersArray.shift();
            }
        }
    
        return payloadBuffer; 
    }


    #sendEcho() {
       
        // extract all the fragments to get the actual payload content
        const fullMessage = Buffer.concat(this.#fragments); 

        let payloadLength = fullMessage.length; 
        
        let additionalPayloadSizeIndicator = null; 

        // determine the additional bytes required to represent the payload size
        switch (true) {
            case (payloadLength <= CONSTANTS.SMALL_PAYLOAD_FLAG):
                additionalPayloadSizeIndicator = 0; 
                break;
            case (payloadLength > CONSTANTS.SMALL_PAYLOAD_FLAG && payloadLength <= CONSTANTS.MEDIUM_DATA_SIZE): 
                additionalPayloadSizeIndicator = CONSTANTS.MEDIUM_PAYLOAD_CONSUMSPTION;
                break; 
            default:
                additionalPayloadSizeIndicator = CONSTANTS.LARGE_PAYLOAD_CONSUMPTION 
        };

        const frame = Buffer.alloc(CONSTANTS.MINUMUM_SIZE + additionalPayloadSizeIndicator + payloadLength);
        
    
        // create first byte
        let fin = 0x01; 
        let rsv1 = 0x00;
        let rsv2 = 0x00;
        let rsv3 = 0x00;
        let opcode = CONSTANTS.OPCODE_BINARY; 
        // shift biwise operator - shift all bits to their correct positions
        let firstByte = (fin << 7) | (rsv1 << 6) | (rsv2 << 5) | (rsv3 << 4) | opcode;
        frame[0] = firstByte; // FIN, RSV, + OPCODE

      
        // server to client do not require mask
        let maskingBit = 0x00; 


        //Determine the payload Flag of the Frame
        if(payloadLength <= CONSTANTS.SMALL_PAYLOAD_FLAG) {
            
            frame[1] = (maskingBit | payloadLength);
        } else if (payloadLength <= CONSTANTS.MEDIUM_DATA_SIZE) {
        
            frame[1] = (maskingBit | CONSTANTS.MEDIUM_PAYLOAD_FLAG);
           
            frame.writeUInt16BE(payloadLength, CONSTANTS.MINUMUM_SIZE); 
        } else {
          
            frame[1] = (maskingBit | CONSTANTS.LARGE_PAYLOAD_FLAG); 
            
            frame.writeBigInt64BE(BigInt(payloadLength), CONSTANTS.MINUMUM_SIZE);
        };

      

        // copy our message into the frame buffer
        const messageStartOffset = CONSTANTS.MINUMUM_SIZE + additionalPayloadSizeIndicator;
        fullMessage.copy(frame, messageStartOffset);

    
        this._socket.write(frame);
        this.#reset();
    };

   

    

//If a frame with the opcode 8 is recevied, means the client wants to close the connection
    #getCloseInfo(){

//Closure frames can not be fragmented, meaning position 0 contains the entire the close frame
        
        let closureFrame=this.#fragments[0];



        if(!closureFrame){

            this.#sendClose(1001,'send proper message next time')

            
        }


        //Close are in the first two bytes and the closeReason in the second two Bytes
        let closeCode=closureFrame.readUInt16BE();

        let closeReason=closureFrame.toString('utf8',2)

        console.log(`Received close frame with the code ${closeCode} and the reason ${closeReason}`);

        let serverResponse="bai"



        
        this.#sendClose(closeCode,serverResponse)



       



    };


    //Send close is necesary to understand the reason and sen the proper response to client so the conneciton can be close as the RFC6455 intended

    #sendClose(cCode,cReason){

        

        let closureCode=(typeof cCode!='undefined' && cCode)? cCode:1000

        let closureReason=(typeof cReason!='undefined' && cReason)? cReason:""




        const closureReasonBuffer=Buffer.from(closureReason,'utf-8')

        const closureReasonLength=closureReasonBuffer.length;

        


        const closeFramePayload=Buffer.alloc(CONSTANTS.MINUMUM_SIZE + closureReasonLength);


        //fill the closure code and the closure reason 
        closeFramePayload.writeInt16BE(closureCode,0);

        closureReasonBuffer.copy(closeFramePayload,2)


        //Create the infoBytes

        const firstByte=   0b10000000 | 0b00000000  | 0b00000000 | 0b00000000 | 0b00001000;

        //create the payload lag bytes, all closure payloads cant be bigger than 124, so this flag indicates the actual payload size
        const secondByte= closeFramePayload.length;

        const mandatoryFrame=Buffer.from([firstByte,secondByte])

        const closeFrame=Buffer.concat([mandatoryFrame,closeFramePayload]);

      //Send the closeFrame to the client and close the socket connection immediately

        this._socket.write(closeFrame);

        this._socket.end()

        
      this.#reset()

    












    };


    #reset() {
        this.#buffersArray = []; 
        this.#bufferedBytesLength= 0;
        this.#taskLoop = false; 
        this.#task = CONSTANTS.GET_INFO;
        this.#fin = false; 
        this.#opcode = null; 
        this.#mask = false; 
        this.#initialPayloadLength = 0; 
        this.#framePayloadLength = 0; 
        this.#totalPayloadLength = 0; 
        this.#maskKey = Buffer.alloc(CONSTANTS.MASK_KEY_CONSUMSPTION); 
        this.#totalFrames = 0; 
        this.#fragments = []; 
    }; // *end reset
    

}
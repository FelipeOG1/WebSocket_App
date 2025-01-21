const { METHODS } = require("http");

module.exports={

    PORT:8080,
    CUSTOM_ERRORS:['uncaughtException','unhandledRejection','SIGINT'],
    METHOD:'GET',
    VERSION: 13,
    CONNECTION:'upgrade',
    UPGRADE:'websocket',
    ALLOWED_ORIGINS:['http://localhost:5500','http://127.0.0.1:5500','null'],
    GUID:'258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
    GET_INFO:1,
    GET_LENGTH:2,
    GET_MASK_KEY:3,
    GET_PAYLOAD:4,
    SEND_ECHO:5,

    MEDIUM_PAYLOAD_FLAG:126,

    LARGE_PAYLOAD_FLAG:127,




    MINUMUM_SIZE:2,

    MEDIUM_PAYLOAD_CONSUMSPTION:2,


    LARGE_PAYLOAD_CONSUMPTION:8,

    MASK_KEY_CONSUMSPTION:4,





     

}





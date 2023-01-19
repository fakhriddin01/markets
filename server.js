let http = require('http');
let dotenv = require('dotenv');

dotenv.config();

let server = http.createServer();
let port = process.env.PORT  || 6000;

server.on('request', ()=>{
    
})

server.listen(port, ()=>{
    console.log(`server running on port ${port}`);
})
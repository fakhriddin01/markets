const http = require('http');
const dotenv = require('dotenv');
const fs = require('fs');
const jwt = require('jsonwebtoken')
const {read, write_file} = require('./src/fs_api')
const url = require('url')
dotenv.config();

let options = {'content-type': 'application/json'}

let users = JSON.parse(fs.readFileSync('./models/users.json'))

let server = http.createServer();
let port = process.env.PORT  || 6000;

server.on('request', async (req, res)=>{
    let id = url.parse(req.url).path.split('/')[2]
    
    if(req.method == 'POST'){
        if(req.url == '/login'){
            req.on('data', chunk => {
                let user = JSON.parse(chunk);
            
                let findUser = users.find(u => {
                    if(user.username == u.username && user.password == u.password){
                        return u;
                    }
                })

                if(findUser){
                    let token = jwt.sign({ id: findUser.userId}, process.env.SECRET_KEY, {
                        expiresIn: '30m'
                    })
                    res.writeHead(200, options )
                    return res.end(JSON.stringify({token}))
                }

                res.writeHead(400, options);
                res.end(JSON.stringify({
                    msg: "user not found"
                }))
            })
        }
        
    }
    if(req.method == 'GET'){
        try {
             await jwt.verify(req.headers.authorization, process.env.SECRET_KEY)
        } catch (error) {
            return res.end('Please update the token')
        }
        if(req.url == '/markets'){
            let markets = read('markets.json')
            let branches= read('branches.json')
            markets.forEach(m => {
                let branchlar=[];
                branches.forEach(b => {
                    if(b.marketId == m.marketId){
                        branchlar.push(b);
                    }
                })
                m.branches = branchlar;
            })
            res.writeHead(200, options)
            res.end(JSON.stringify(markets))
            
        }
        if(req.url == `/markets/${id}`){
           let markets = read('markets.json')
           let branches = read('branches.json')
           let findMarket = markets.find(m => m.marketId == id);
           if(!findMarket){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'market with this id not found'
                }))
           }
           let branchlar = []
           branches.forEach(b => {
                if(b.marketId == id){
                    branchlar.push(b)
                }
           })
           findMarket.branches = branchlar
           res.writeHead(200, options)
           res.end(JSON.stringify({findMarket}));
        }
    }
})

server.listen(port, ()=>{
    console.log(`server running on port ${port}`);
})
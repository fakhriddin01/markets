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
        }else{
            try {
                await jwt.verify(req.headers.authorization, process.env.SECRET_KEY)
            } catch (error) {
                return res.end('Please update the token')
            }
        }


        if(req.url == '/markets'){
            req.on('data', chunk=>{
                let data = JSON.parse(chunk);
                let markets = read('markets.json');
                foundMarket=markets.find(m => m.name == data.name);
                if(foundMarket){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: "This market name already exists"
                    }))
                }

                if(!data.name){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'Please fill up the form correctly',
                        form:   {
                            "name": "market name"
                        }
                    }))
                }

                if(data.name.trim().length == 0){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'please fill out inputs'
                    }))
                }

                markets.push(
                {
                    marketId: markets.at(-1).marketId +1, 
                    name: data.name
                })
                write_file('markets.json', markets)
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: "market created!"
                }))
            })
        }

        if(req.url == '/branches'){
            req.on('data', chunk=>{
                let newBranch = JSON.parse(chunk);
                if(!(newBranch.name && newBranch.address && newBranch.marketId)){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'Please fill up the form correctly',
                        form:   {
                            "name": "",
                            "address": "",
                            "marketId": ""
                        }
                    }))
                }
                if(newBranch.name.trim().length ==0 || newBranch.address.trim().length ==0){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'please fill out all inputs'
                    }))
                }

                branches = read('branches.json');
                branches.push({branchId: branches.at(-1).branchId +1, name: newBranch.name, address: newBranch.address, marketId: newBranch.marketId})
                write_file('branches.json', branches);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'branch added!'
                }))

            })
        }

        if(req.url == '/workers'){
            req.on('data', chunk=>{
                let worker = JSON.parse(chunk);
                if(!(worker.name && worker.phoneNumber && worker.branchId)){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'Please fill up the form correctly',
                        form:   {
                            "name": "",
                            "phoneNumber": "",
                            "branchId": ""
                        }
                    }))
                }
                if(worker.name.trim().length ==0 || worker.phoneNumber.trim().length ==0){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'please fill out all inputs'
                    }))
                }
                let workers= read('workers.json');
                workers.push({workerId: workers.at(-1).workerId + 1, name: worker.name, phoneNumber: worker.phoneNumber, branchId: worker.branchId})
                write_file('workers.json', workers);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'worker added!'
                }))

            })
        }

        if(req.url == '/products'){
            req.on('data', chunk=>{
                let product = JSON.parse(chunk);
                if(!(product.title && product.price && product.branchId)){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'Please fill up the form correctly',
                        form:   {
                            "title": "",
                            "price": "",
                            "branchId": ""
                        }
                    }))
                }
                if(product.title.trim().length ==0 || product.price.trim().length ==0){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'please fill out all inputs'
                    }))
                }
                let products= read('products.json');
                products.push({productId: products.at(-1).productId + 1, title: product.title, price: product.price, branchId: product.branchId})
                write_file('products.json', products);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'product added!'
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

        if(req.url == '/branches'){
            let branches = read('branches.json');
            
            let products = read('products.json');
            let workers = read('workers.json');
            branches.forEach(b => {
                let workerlar = [];
                let productlar = [];
                delete b.marketId;
                products.forEach(p => {
                    if(p.branchId == b.branchId){
                        delete p.branchId;
                        productlar.push(p)
                    }
                })
                b['products'] = productlar;
                workers.forEach(w => {
                    if(w.branchId == b.branchId){
                        delete w.branchId;
                        workerlar.push(w);
                    }
                })
                b['workers'] = workerlar;
            })

            res.writeHead(200, options)
            res.end(JSON.stringify(branches));

        }

        if(req.url == `/branches/${id}`){
            let branches = read('branches.json');
            
            let products = read('products.json');
            let workers = read('workers.json');
            let foundBranch = branches.find(b => b.branchId == id);
            if(!foundBranch){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'branch with this id not found'
                }))
            }


            let workerlar = [];
            let productlar = [];
            products.forEach(p => {
                if(p.branchId == foundBranch.branchId){
                    delete p.branchId;
                    productlar.push(p)
                }
            })
            foundBranch['products'] = productlar;
            workers.forEach(w => {
                if(w.branchId == foundBranch.branchId){
                    delete w.branchId;
                    workerlar.push(w);
                }
            })
            foundBranch['workers'] = workerlar;
            delete foundBranch.marketId;
            res.writeHead(200, options)
            res.end(JSON.stringify(foundBranch));
        }


        if(req.url == '/workers'){
            let workers = read('workers.json')
            res.writeHead(200, options);
            res.end(JSON.stringify(workers));
        }

        if(req.url == `/workers/${id}`){
            let workers = read('workers.json');
            let foundWorker = workers.find(w => w.workerId == id);
            if(!foundWorker){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'worker with this id not found'
                }))
            }

            res.writeHead(200, options);
            res.end(JSON.stringify(foundWorker));

        }

        if(req.url == '/products'){
            let products = read('products.json')
            res.writeHead(200, options);
            res.end(JSON.stringify(products));
        }

        if(req.url == `/products/${id}`){
            let products = read('products.json');
            let foundProduct = products.find(p => p.productId == id);
            if(!foundProduct){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'product with this id not found'
                }))
            }

            res.writeHead(200, options);
            res.end(JSON.stringify(foundProduct));

        }
    }

    if(req.method == 'PUT'){
        try {
            await jwt.verify(req.headers.authorization, process.env.SECRET_KEY)
        } catch (error) {
            return res.end('Please update the token')
        }
        if(req.url == `/markets/${id}`){
            req.on('data', chunk=>{
                let data = JSON.parse(chunk)
                let markets = read('markets.json');
                let foundMarket = markets.find(m => m.marketId == id);

                if(!foundMarket){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'market with this id not found'
                    }))
                }
                
                markets.forEach(m => {
                    if(m.marketId == id){
                        m.name = data.name
                    }
                })

                write_file('markets.json', markets);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: "market updated!! "
                }))


            })
            
        }

        if(req.url == `/branches/${id}`){
            req.on('data', chunk =>{
                let update = JSON.parse(chunk);
                let branches = read('branches.json');
                let foundBrach;
                branches.forEach(b => {
                    if(b.branchId == id){
                        foundBrach = b;
                        b.name = update.name || b.name;
                        b.address = update.address || b.address;
                        b.marketId = update.marketId || b.marketId;
                    }
                })
                if(!foundBrach){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'Branch with this id not found'
                    })) 
                }

                write_file('branches.json', branches);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'Branch updated!'
                }))
            })
        }

        if(req.url == `/workers/${id}`){
            req.on('data', chunk =>{
                let worker = JSON.parse(chunk);
                let workers=read('workers.json');
                let foundWorker;
                workers.forEach(w => {
                    if(w.workerId == id){
                        foundWorker = w;
                        w.name = worker.name || w.name;
                        w.phoneNumber = worker.phoneNumber || w.phoneNumber;
                        w.branchId = worker.branchId || w.branchId;
                    }
                })
                if(!foundWorker){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'worker with this id not found'
                    }))
                }
                write_file('workers.json', workers);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'worker info updated!'
                }))
            })
        }


        if(req.url == `/products/${id}`){
            req.on('data', chunk =>{
                let product = JSON.parse(chunk);
                let products=read('products.json');
                let foundProduct;
                products.forEach(p => {
                    if(p.productId == id){
                        foundProduct = p;
                        p.title = product.title || p.title;
                        p.price = product.price || p.price;
                        p.branchId = product.branchId || p.branchId;
                    }
                })
                if(!foundProduct){
                    res.writeHead(400, options);
                    return res.end(JSON.stringify({
                        msg: 'product with this id not found'
                    }))
                }
                write_file('products.json', products);
                res.writeHead(200, options)
                res.end(JSON.stringify({
                    msg: 'product info updated!'
                }))
            })
        }
    }

    if(req.method == 'DELETE'){
        try {
            await jwt.verify(req.headers.authorization, process.env.SECRET_KEY)
        } catch (error) {
            return res.end('Please update the token')
        }

        if(req.url == `/markets/${id}`){
            let markets=read('markets.json');
            let foundMarket = markets.find(m => m.marketId == id);

            if(!foundMarket){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'market with this id not found'
                }))
            }

            markets.forEach((m, idx) => {
                if(m.marketId == id){
                    markets.splice(idx, 1);
                }
            })
            write_file('markets.json', markets);
            res.writeHead(200, options)
            res.end(JSON.stringify({
                msg: "market deleted!! "
            }))
        }

        if(req.url == `/branches/${id}`){
            let branches = read('branches.json');
            let foundBrach;
            branches.forEach((b, inx) => {
                if(b.branchId == id){
                    foundBrach = b;
                    branches.splice(inx, 1);
                }
            })
            if(!foundBrach){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'branch with this id not found'
                })) 
            }

            write_file('branches.json', branches);
            res.writeHead(200, options)
            res.end(JSON.stringify({
                msg: "branch deleted!! "
            }))

        }

        if(req.url == `/workers/${id}`){
            let workers = read('workers.json');
            let foundWorker; 
            workers.forEach((w, inx) =>{
                if(w.workerId == id){
                    foundWorker = w;
                    workers.splice(inx, 1);
                }
            })
            if(!foundWorker){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'worker with this id not found'
                })) 
            }

            write_file('workers.json', workers);
            res.writeHead(200, options)
            res.end(JSON.stringify({
                msg: "worker deleted!! "
            }))
        }

        if(req.url == `/products/${id}`){
            let products = read('products.json');
            let foundProduct; 
            products.forEach((p, inx) =>{
                if(p.productId == id){
                    foundProduct = p;
                    products.splice(inx, 1);
                }
            })
            if(!foundProduct){
                res.writeHead(400, options);
                return res.end(JSON.stringify({
                    msg: 'product with this id not found'
                })) 
            }

            write_file('products.json', products);
            res.writeHead(200, options)
            res.end(JSON.stringify({
                msg: "product deleted!! "
            }))
        }
    }

    


})

server.listen(port, ()=>{
    console.log(`server running on port ${port}`);
})
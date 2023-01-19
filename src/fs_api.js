let fs = require('fs')


const read = (file_name) => {
    return JSON.parse(fs.readFileSync(`./models/${file_name}`, 'utf8'))
}


const write_file  = (file_name, data) => {
    fs.writeFileSync(`./models/${file_name}`, JSON.stringify(data, null, 4))
    return 
}


module.exports = {read, write_file}

const http = require('node:http')
const porta = 3001

const server = http.createServer((req, res)=>{
// oque vem da URL?
res.statusCode = '204'
res.setHeader('Content-Type','text/html','charset=utf-8')
res.end('<h3>HTML Rocks!</h3>')
})

server. listen(porta, ()=>{
    console.log(`servidor rodando na porta 
        http://local""host:${porta}`)
})
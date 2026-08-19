const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const porta = 8081

const home = path.join(__dirname, 'pages/home.html')
const sobre = path.join(__dirname, 'pages/sobre.html')
const image = path.join(__dirname, 'images/image.png')
const css = path.join

const server = http.createServer((req, res) => {
    const novaUrl = new URL(req.url, `http://${req.headers.host}`) //http://localhost
    const caminhoUrl = novaUrl.pathname
    if(caminhoUrl === '/sobre'){
        res.statusCode = '200'
       //res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(fs.readFileSync(home, 'utf-8')) //chamar o html
    }
      if(caminhoUrl === '/public/estilo.css'){
        res.statusCode = '201'
       //res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Type', 'text/css')
         return res.end(fs.readFileSync(css, 'utf-8')) //chamar o html
    } 
    
})

server.listen(porta, () => {
    console.log(`Servidor rodando na porta 
        http://localhost:${porta}`)
})
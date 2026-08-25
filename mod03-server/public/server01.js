const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const porta = 8081
const raiz = path.join(__dirname, '..')

const home = path.join(raiz, 'pages/index.html')
const sobre = path.join(raiz, 'pages/sobre.html')
const servicos = path.join(raiz, 'pages/servicos.html')
const error = path.join(raiz, 'pages/erro.html')
const estilo = path.join(raiz, 'public/estilo.css')
const estiloErro = path.join(raiz, 'public/erro.css')
const imagem = path.join(raiz, 'images/image.png')

const Server = http.createServer((req, res) => {
    const novaUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const caminhoUrl = novaUrl.pathname
    if (caminhoUrl === '/') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(fs.readFileSync(home, 'utf-8'))
    } 
    if (caminhoUrl === '/sobre') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(fs.readFileSync(sobre, 'utf-8'))
    }
    if (caminhoUrl === '/servicos') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(fs.readFileSync(servicos, 'utf-8'))
    }
     if (caminhoUrl === '/public/estilo.css') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/css; charset=utf-8')
        return res.end(fs.readFileSync(estilo, 'utf-8'))
    }
    if (caminhoUrl === '/public/erro.css') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/css; charset=utf-8')
        return res.end(fs.readFileSync(estiloErro, 'utf-8'))
    }
    if (caminhoUrl === '/image/image.png') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/png')
        return res.end(fs.readFileSync(imagem))
    }
    if (caminhoUrl === '/404') {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(fs.readFileSync(error, 'utf-8'))
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('<h3>404 PÁGINA NÃO ENCONTRADA</h3>')
})

Server.listen(porta, () => {
    console.log(`Servidor rodando na porta http://localhost:${porta}`)
})

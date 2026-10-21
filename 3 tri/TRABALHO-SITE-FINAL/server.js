import express from 'express'
import path from 'path' // resolver conflitos de pasta
const PORT = 3000
const app = express()

const baseDir = import.meta.dirname
// Usar Middleware (software guardião)
app.use(express.static(path.join(baseDir, 'src/publico')))

app.get('/', (req, res) => {//callback ou retorno 
    res.sendFile('src/paginas/index.html', {root: baseDir})
})

app.get('/contato', (req, res) => {//callback ou retorno 
    res.sendFile('src/paginas/contato.html', {root: baseDir})
})

app.get('/produtos', (req, res) => {//callback ou retorno 
    res.sendFile('src/paginas/produtos.html', {root: baseDir})
})

app.get('/sobre', (req, res) => {//callback ou retorno 
    res.sendFile('src/paginas/sobre.html', {root: baseDir})
})

app.listen(PORT, () => {console.log('Servidor Vivo!')})
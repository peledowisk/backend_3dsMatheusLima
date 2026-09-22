import express from 'express'
import path from 'path' // resolver conflitos de pasta
const PORT = 3000
const app = express()
// Usar Middleware (software guardião)
app.use(express.static(path.join(import.meta.dirname, 'public')))

app.get('/',(req, res) => {
    res.send('src/pages/index.html', {root:import.meta.dirname})
})

app.listen(PORT, () => {console.log('Servidor vivo!')})
import path from `path`
const PORT = process.env.PORT || 3000
const app = express()
const baseDir = import.meta.dirname 
// midleware (guardião)
app.use(express.static(path.join(baseDir,'src/public')))

app.get('/', (req, res) => {
    res.sendFile('pages/index.html', {root: baseDir})
})

app.listen(PORT,()=> {console.log('Servidor Ok na porta ' +PORT)})
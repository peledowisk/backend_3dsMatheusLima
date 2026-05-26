
const fs = require('fs')

// console.log(fs)
const arquivo = fs.readFileSync('./READ.md','utf-8')
//  /workspaces/backend_3dsMatheusLima/2 tri/modulos/mod-03-FS/ReadableStreamDefaultController.md
// 2 tri/modulos/mod-03-FS/README.md
const arquivoFinal = fs.readFileSync(__dirname +"/README.md","utf-8")
console.log(arquivoFinal)

const fs = require('node:fs')
const path = require('node:path')
const frasePreferida = `Nu Zé!\n`
const log = `Atenção, você está offline...\n`

try {
    const arquivo = path.resolve(__dirname, 'frase.md')
    fs.appendFileSync(arquivo, frasePreferida, 'utf-8')

    // Reescreve totalmente o conteúdo
    fs.appendFileSync(arquivo, log, 'utf-8')
    fs.appendFileSync(arquivo, log, 'utf-8')

} catch (error) {
console.log(error.message)
}
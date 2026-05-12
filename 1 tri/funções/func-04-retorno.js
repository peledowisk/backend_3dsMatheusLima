// Funções de retorno exigem a 
// cláusula/termo 'return' 
//isso permite fazer operações
//sequenciais com o resultado
//armazenar função em variáveis

function sobraDoSalario(meuSalario) {
    const valorDoAluguel = 1200
    const valorDaLuz = 150
    const sobra = meuSalario - (valorDoAluguel + valorDaLuz)
   return `Sobra do salário: R$ ${sobra.toFixed(2).replace('.', ',')}`
    
}
const minhaSobra = sobraDoSalario(1700)
console.log(minhaSobra)
const meuSalario = 13000
const sobra = sobraDoSalario(meuSalario)
console.log(`Sobra do salário armazenada em variável: R$ ${sobra}`)
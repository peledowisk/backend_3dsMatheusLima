//Crie  um perfil profissional que 
//Interpole uma frase é um objeto com
// as características do profissional a sua escolha. 

//criar um objeto profissional

//criar variavel com interpolação(template)

//imprimir perfilProfissional

const profissional = {
    nome: 'Matheus',
    idade: 28,
    profissao: 'Desenvolvedor',
    cidade: 'São Paulo',
    caracteristicas: ['Criativo', 'Proativo', 'Trabalhador'],
}

const perfilProfissional = `Olá, meu nome é ${profissional.nome}, tenho ${profissional.idade} anos, sou ${profissional.profissao} e moro em ${profissional.cidade}. Minhas características são: ${profissional.caracteristicas.join(', ')}.`
console.log(perfilProfissional)
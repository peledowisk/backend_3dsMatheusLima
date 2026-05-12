// Crie  um  array que contenha 3 frutas
// Adicione mais 4 frutas com o método  .push(<nomeFruta>)
// Remova 1 fruta do array com o método .pop()
// faça um loop para remover todas as frutas
//verifique se o array está vazio
// imprima "Nenhuma fruta encontrada"

const frutas = ["banana", "maçã", "laranja"]
//console.log(frutas)
frutas.push("uva")
frutas.push("abacaxi")
frutas.push("manga")
frutas.push("pera")
//console.log(frutas)
    console.log(frutas.length)//comprimento dess
        while (frutas.length > 0) {
    frutas.pop()
    if (frutas.length == 0) {
        console.log("Nenhuma fruta para venda!!!")
    }
}
console.log(frutas)
console.log(frutas.length)
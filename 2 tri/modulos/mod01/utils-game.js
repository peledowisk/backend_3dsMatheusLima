
let health = 100;

function takeDamage(arma, dano) {
    if (health <= 0){
        console.log("Game Over");
    } else {
        const danoTotal = health - dano;
        return '${arma} causou ${dano} de dano. Vida restante: ${health - dano}'
    }

    module.exports = {
        takeDamage
    }
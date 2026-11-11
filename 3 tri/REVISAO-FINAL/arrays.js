// Agrupamento sequencial (ZERTO até INFINITY)
// Permite dados heterogêneos (números, palavras, etc)

const roupas = ['camiseta','vestido','jeans','bermuda']
       //           0          1         2         3  
roupas[999] // undefined 
//console.log(roupas[2])// vestido 
// Loop de repetição infinita 
for (const roupa of roupas) {
    console.log(roupa)
}
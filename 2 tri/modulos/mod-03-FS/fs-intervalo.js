``// Executa uma única vez(em ms)
setTimeout(function(){
    console.log('Era uma vez...')
}, 3000)


// Executa infinitamente (em ms)
let v = 1
setInterval(function(){
    console.log(`Rodou ${v} vez(s)`)
    v = v + 1
}, 1000)
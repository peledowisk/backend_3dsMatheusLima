// import {alugarFilme, devolverFilme} from './esm-videos.js'
import * as videoTeca from './esm-videos.js'
// * significa TUDO e "as" COMO, com sentido APELIDO
console.log(videoTeca.alugarFilme('transformers','2019-06-09', '19,90'))

console.log(videoTeca.devolverFilme('transformers','2019-09-09'))

console.log(videoTeca.alugarFilme('365 dias','2019-12-08', '15,00'))

console.log(videoTeca.devolverFilme('365 dias','2019-13-08'))


# Player One

Portal gamer demonstrativo feito com Express e JavaScript sem framework. Inclui catálogo pesquisável, avaliações de usuários, listas pessoais, perfis, artigos, comentários, respostas, curtidas, conquistas e alternância de tema.

## Executar localmente

```sh
npm install
npm start
```

Acesse `http://localhost:3000`. O servidor salva contas e interações em `data/site.json`, que não deve ser versionado. As senhas são derivadas com `scrypt`; sessões usam cookies `HttpOnly` e assinados. Para manter as sessões válidas entre reinicializações, defina `SESSION_SECRET` com pelo menos 32 caracteres aleatórios.

```sh
SESSION_SECRET="uma-chave-aleatoria-com-pelo-menos-32-caracteres" npm start
```

## Escopo desta versão

Esta é uma base local para MVP, não um serviço pronto para produção. O catálogo e os artigos são dados de demonstração; painel editorial, publicação de conteúdo, integração de vídeos e login social ainda precisam ser implementados. A moderação automática usa uma lista curta de termos e precisa de revisão humana. A persistência em arquivo único não é adequada a múltiplas instâncias ou alto volume.

O deploy ainda precisa de HTTPS configurado no servidor ou proxy, segredo persistente, armazenamento de dados apropriado, backups automáticos e políticas operacionais de privacidade/LGPD. O aviso de privacidade da interface descreve as limitações; não use dados pessoais reais neste protótipo.

## Verificações

```sh
npm test
```

# Moneta

Carteira virtual para acompanhar ações e ETFs. Os dados da carteira ficam apenas no armazenamento local do navegador; não há conta ou sincronização entre dispositivos.

## Executar

Requer Node.js 18 ou superior. Execute `npm start` e acesse a porta 3000 (ou defina `PORT`). Não é necessário instalar dependências.

A busca e as cotações usam endpoints públicos do Yahoo Finance através do servidor. É necessário acesso de rede a `query1.finance.yahoo.com`; o serviço pode limitar requisições ou estar indisponível. As cotações podem ter atraso e não devem ser usadas como aconselhamento financeiro. Cotações em dólar são convertidas para reais usando USD/BRL; outras moedas não são suportadas. Informe o preço de compra por unidade em reais. A rentabilidade geral é ponderada pelo valor investido e exclui posições sem cotação. Os exemplos iniciais são fictícios e podem ser removidos.

## Publicar na Vercel

Importe o repositório na Vercel e publique a branch desejada. O arquivo `vercel.json` serve a interface como arquivos estáticos e publica `/api/search` e `/api/quotes` como funções Node.js; o servidor local não é iniciado na Vercel. Não é preciso configurar comando de build nem variáveis de ambiente. Caso a função ainda falhe após uma nova publicação, consulte os logs do deployment na Vercel: o Yahoo Finance é um serviço externo e pode bloquear ou limitar chamadas.

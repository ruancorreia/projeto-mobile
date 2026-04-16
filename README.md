# Unilasalle

## Projeto Desenvolvimento Mobile

Professor: JOAO PAULO BAPTISTA VOIGTLAENDER  
JOAO PAULO BAPTISTA VOIGTLAENDER

## Requisitos

COMPETENCIA A SER DESENVOLVIDA: construir aplicativos hibridos (Android e iOS) utilizando o framework de JavaScript React Native para interacao entre usuario e aplicacao.

DATA DE ENTREGA/APRESENTACAO: 9 de junho de 2026.

FORMA DE ENTREGA: realizar o download deste arquivo na sala de aula do Google Classroom, colocar o nome e a matricula dos componentes do grupo, colocar o nome do livro escolhido pelo grupo, colocar o codigo dos programas nos quadros destinados ao mesmo, marcar o gabarito dos programas, salvar esse arquivo em PDF e adicionar esse arquivo e o link Snack da aplicacao React Native na atividade Trabalho de 2a Avaliacao na sala de aula do Google Classroom e marcar a atividade como entregue.

OBSERVACAO: nao serao aceitos trabalhos apos a data de entrega, grupos com mais de 4 alunos e grupos com aplicacoes iguais.

## Descricao

O programa foi criado para que o usuario responda as 30 perguntas de cada programa do livro. O processo de execucao do programa contempla as seguintes regras:

- Para cada pergunta, o usuario tera 3 tentativas de resposta.
- Caso acerte na 1a tentativa, o usuario ganhara 3 pontos.
- Caso acerte na 2a tentativa, o usuario ganhara 2 pontos.
- Caso acerte na 3a tentativa, o usuario ganhara 1 ponto.
- Caso nao acerte em nenhuma das 3 tentativas, o usuario nao ganhara pontos.
- Ao final da resposta das perguntas do programa, o sistema apresenta o total de pontos obtidos.

## Formato do Programa

O aplicativo e hibrido e foi criado com React Native usando Expo. Pode ser executado para Android, iOS e Web.

## Funcionalidades Implementadas

- Tela inicial para digitacao do numero do livro.
- Validacao de livro cadastrado com mensagem de erro quando nao encontrado.
- Leitura de gabarito por codigo de livro no diretorio de gabaritos.
- Exibicao do painel com 4 botoes de resposta:
  A - Vermelho  
  B - Amarelo  
  C - Azul  
  D - Verde
- Atalhos de teclado para resposta:
  Q = opcao A  
  W = opcao B  
  A = opcao C  
  S = opcao D
- Controle de tentativas e pontuacao por pergunta.
- Resumo de pontos por programa e total acumulado no livro.

## Estrutura de Gabaritos

Os gabaritos estao organizados por livro no diretorio src/gabarito.

Exemplos:

- src/gabarito/021.ts
- src/gabarito/081.ts
- src/gabarito/131.ts

Para adicionar um novo livro, criar um novo arquivo com o codigo do livro e registrar no arquivo src/gabarito/index.ts.

## Como Executar o Projeto

### Pre-requisitos

- Node.js instalado
- npm instalado
- Expo CLI (via npx)

### Instalacao

1. Instalar dependencias:

npm install

### Execucao

1. Iniciar projeto:

npm run start

2. Executar no Android:

npm run android

3. Executar no iOS:

npm run ios

4. Executar na Web:

npm run web

## Dados do Grupo

- Integrante 1: NOME COMPLETO - MATRICULA
- Integrante 2: NOME COMPLETO - MATRICULA
- Integrante 3: NOME COMPLETO - MATRICULA
- Integrante 4: NOME COMPLETO - MATRICULA

## Livro Escolhido

- Livro: CODIGO E NOME DO LIVRO

## Link do Snack

- Inserir link publico do projeto no Snack Expo

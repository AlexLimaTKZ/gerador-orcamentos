# Gerador de Orçamentos

Aplicação web para a criação e gerenciamento de orçamentos, com a capacidade de gerar arquivos PDF com layout customizado.

## ✨ Funcionalidades

- **Criação de Orçamentos**: Interface simples para adicionar produtos, detalhes, cliente e informações da empresa.
- **Listagem e Edição**: Visualize todos os orçamentos salvos, edite-os ou exclua-os.
- **Geração de PDF**: Converte o orçamento preenchido em um arquivo PDF com layout profissional, pronto para ser enviado ao cliente.
- **Upload de Imagens**: Permite associar imagens de produtos aos itens do orçamento.
- **Tema Claro/Escuro (Dark Mode)**: Alterne entre os temas para melhor visualização. A sua preferência é salva no navegador.
- **Banco de Dados**: Armazena informações de clientes, produtos e orçamentos (atualmente configurado para SQLite).

## 🚀 Tecnologias Utilizadas

- **Back-end**: Node.js, Express.js
- **Front-end**: HTML5, CSS3, JavaScript
- **Motor de Templates**: EJS (Embedded JavaScript)
- **Banco de Dados**: Knex.js com SQLite
- **Geração de PDF**: Puppeteer (Headless Chrome)
- **Variáveis de Ambiente**: Dotenv

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 16 ou superior)
- [NPM](https://www.npmjs.com/) (geralmente instalado com o Node.js)

## ⚙️ Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd gerador-orcamentos
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Crie uma cópia do arquivo `.env.example` e renomeie para `.env`.
    - Se necessário, ajuste a porta do servidor.
    ```bash
    # Exemplo de .env
    PORT=3000
    ```

4.  **Inicie o servidor:**

    - Para ambiente de desenvolvimento (com reinicialização automática ao salvar arquivos):
      ```bash
      npm run dev
      ```

    - Para produção:
      ```bash
      npm start
      ```

5.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:3000`.

## 🔧 Configuração

### Dados da Empresa

Os dados da sua empresa (nome, endereço, contato, etc.) são fixos e estão diretamente no arquivo `public/index.html`. Para alterá-los, edite os valores (`value="..."`) dos campos dentro do `<fieldset>` que tem a legenda "Dados da Empresa".

Este `fieldset` está oculto na página, mas os dados são usados na geração do PDF.

## 📁 Estrutura do Projeto

```
gerador-orcamentos/
├── data/               # (Ignorado pelo Git) Armazena o banco de dados SQLite.
├── public/             # Arquivos estáticos (CSS, imagens, frontend)
│   ├── css/            # Estilos CSS, incluindo o tema claro/escuro.
│   ├── img/            # Imagens estáticas (ex: logo).
│   ├── js/             # Scripts JavaScript do lado do cliente (ex: seletor de tema).
│   └── uploads/        # (Ignorado pelo Git) Imagens de produtos enviadas.
├── src/                # Código-fonte do back-end
│   ├── db.js           # Configuração do banco de dados (Knex).
│   ├── generator.js    # Lógica de geração de PDF com Puppeteer.
│   └── routes.js       # Definição das rotas da API.
├── templates/          # Templates EJS para a geração dos PDFs
│   └── orcamento.ejs
├── .env.example        # Arquivo de exemplo para variáveis de ambiente.
├── .gitignore          # Arquivos e pastas ignorados pelo Git.
├── package.json        # Dependências e scripts do projeto.
└── server.js           # Arquivo principal de inicialização do servidor Express.
```

## 📄 Licença

Este projeto está sob a licença Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0). Para mais detalhes, veja o arquivo [LICENSE](LICENSE).
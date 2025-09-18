# README — Gerador de Orçamentos (layout igual ao PDF fornecido)
Crie este desafio
> Este README descreve, passo a passo, como criar um software para gerar orçamentos com **layout idêntico** ao PDF que você enviou (modelo "ORCAMENTO\_LINHA\_SUPREMA"). Siga cada seção na ordem indicada.

---

## 1. Visão geral e objetivo

Construir uma aplicação web/back-end que permita:

* Cadastrar dados da empresa (cabeçalho do orçamento), clientes e itens;
* Montar orçamentos (itens com largura, altura, cor do vidro, cor do alumínio, ferragens, quantidade, valor unitário/total);
* Gerar um PDF com *layout idêntico* ao PDF referência (mesma disposição de blocos, tipografia, espaçamentos, tabelas e formatação de valores);
* Baixar e/ou enviar por e-mail o PDF gerado.

**Abordagem recomendada (mais simples para obter pixel-perfect):**

* Criar um template em HTML/CSS que reproduza precisamente o visual do PDF;
* Usar um renderizador headless (Puppeteer) para imprimir o HTML em PDF (A4) — isso permite ajustar CSS até obter correspondência exata.

Outras opções: usar bibliotecas de desenho programático (ReportLab, PDFKit) — mais preciso para desenhos vetoriais, porém mais trabalhoso para recriar layouts complexos.

---

## 2. Tecnologias sugeridas (stack)

**Back-end:** Node.js + Express
**Templating:** EJS (ou Handlebars) para preencher o HTML do orçamento
**Geração de PDF:** Puppeteer (renderiza HTML/CSS como no navegador)
**Banco de dados:** SQLite (simples) ou PostgreSQL/MySQL para produção
**Armazenamento de arquivos:** disco local / S3 para produção
**Envio de e-mail:** nodemailer

> Alternativa (Python): Flask + Jinja2 + WeasyPrint/Headless Chromium.

---

## 3. Pré-requisitos e instalação

1. Node.js (>=16) e npm ou yarn.
2. Git.

Comandos iniciais:

```bash
mkdir gerador-orcamentos
cd gerador-orcamentos
npm init -y
npm install express ejs puppeteer sqlite3 knex nodemailer dotenv moment
npm install --save-dev nodemon
```

Crie a estrutura de pastas sugerida:

```
gerador-orcamentos/
├─ server.js
├─ package.json
├─ .env
├─ /templates        # templates EJS/HTML para PDF
│  └─ orcamento.ejs
├─ /public/css       # css para impressão
│  └─ orcamento.css
├─ /data             # banco sqlite ou arquivo json para dev
├─ /src
│  ├─ db.js
│  ├─ routes.js
│  └─ generator.js   # função que gera o PDF com Puppeteer
└─ /assets
   └─ logo.png
```

---

## 4. Modelo de dados (esquema simplificado)

Sugestão de tabelas (SQL):

* `companies` (id, name, cnpj, address, email, phone, logo\_path, system\_name)
* `clients` (id, name, address, phone, email)
* `quotes` (id, quote\_number, company\_id, client\_id, date, delivery\_date, valid\_until, total, created\_at)
* `quote_items` (id, quote\_id, item\_index, title, description, width\_mm, height\_mm, glass, aluminum\_color, hardware\_color, quantity, unit\_price, total\_price)
* `settings` (id, key, value) — para armazenar texto fixo como "PREVISÃO DE ENTREGA" etc.

Exemplo JSON de um orçamento:

```json
{
  "quote_number": "541",
  "date": "2025-08-25",
  "company": { "name": "VIP ALUMINIO E VIDRAÇARIA", "cnpj": "57.077.012/0001-31", "address": "Avenida Joaquim Ribeiro, 1299, Teresina" },
  "client": { "name": "tauan batista", "address": "Rua Valença, 3784" },
  "items": [
    { "title": "PORTA 3 FOLHAS COM BANDEIRAS COM TRILHO", "width":2160, "height":2550, "glass":"VIDRO 6MM TEMPERADO INCOLOR", "aluminum":"PRETO", "hardware":"PRETO", "quantity":1, "total_price":6097.90 }
  ],
  "delivery_date": "2025-09-19",
  "valid_until": "2025-09-24",
  "total": 36971.91
}
```

---

## 5. Mapeamento dos blocos do PDF (identificar os campos que aparecem no layout)

Para reproduzir **exatamente** o layout do seu PDF, listei os blocos que devem existir no template HTML (ordem vertical):

1. **Cabeçalho da empresa:** nome grande, sub-título (MANAGEASY SISTEMAS), endereço, CNPJ, e contatos (e-mail, celular, telefone). (topo esquerdo)
2. **Número do orçamento + data** (topo direito). Ex.: `ORÇAMENTO 541 25/08/2025`.
3. **Dados do cliente:** nome, endereço, celular.
4. **Título "PRODUTOS"** e listagem de itens numerados (ITEM 1, ITEM 2...) com:

   * Nome do produto / linha
   * Medidas (LARGURA / ALTURA)
   * Cor do vidro
   * Cor dos alumínios
   * Cor das ferragens
   * Quantidade
   * Valor unitário/Valor total (conforme aparece)
5. Blocos repetidos de cabeçalho (no PDF há repetição de nome da empresa em seções — você pode controlar com CSS para mostrar novamente se preciso).
6. **Previsão de entrega** e **Orçamento válido até** (datas).
7. **TOTAL** com destaque e formatação `R$ 36.971,91`.
8. Rodapé com assinaturas/quem emitiu e CNPJ repetido.

> Observação: Repare na tipografia (tudo em maiúsculas em muitos títulos), espaçamento entre linhas e que alguns valores aparecem como "VALOR UNITÁRIO" e outros como "VALOR TOTAL". Reproduza esses rótulos no HTML.

---

## 6. Template HTML básico (exemplo — use EJS para preencher dinamicamente)

> Crie `templates/orcamento.ejs` com placeholders EJS. Exemplo resumido:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Orçamento <%= quote.quote_number %></title>
  <link rel="stylesheet" href="/css/orcamento.css">
</head>
<body>
  <header class="cabecalho">
    <div class="empresa">
      <h1><%= company.name %></h1>
      <div class="sub">MANAGEASY SISTEMAS</div>
      <div class="dados">ENDEREÇO: <%= company.address %></div>
      <div class="dados">CNPJ: <%= company.cnpj %></div>
      <div class="contatos">EMAIL: <%= company.email %> &nbsp; CEL: <%= company.cell %> &nbsp; TEL: <%= company.phone %></div>
    </div>
    <div class="orcamento-info">
      <div class="num">ORÇAMENTO <%= quote.quote_number %></div>
      <div class="data"><%= formatDate(quote.date) %></div>
    </div>
  </header>

  <section class="cliente">
    <strong><%= client.name %></strong>
    <div>ENDEREÇO: <%= client.address %></div>
    <div>CELULAR: <%= client.phone %></div>
  </section>

  <h2>PRODUTOS</h2>

  <section class="itens">
    <% quote.items.forEach(function(item, idx) { %>
      <div class="item">
        <div class="item-title">ITEM <%= idx + 1 %> - <%= item.title %></div>
        <div class="specs">
          LARGURA: <%= item.width_mm %> ALTURA: <%= item.height_mm %>
          <br>COR DO VIDRO: <%= item.glass %>
          <br>COR DOS ALUMÍNIOS: <%= item.aluminum %>
          <br>COR DAS FERRAGENS: <%= item.hardware %>
          <br>QUANTIDADE: <%= item.quantity %>
        </div>
        <div class="valor">VALOR TOTAL: R$ <%= formatCurrency(item.total_price) %></div>
      </div>
    <% }) %>
  </section>

  <section class="resumo">
    <div>PREVISÃO DE ENTREGA: <%= formatDate(quote.delivery_date) %></div>
    <div>ORÇAMENTO VÁLIDO ATÉ: <%= formatDate(quote.valid_until) %></div>
    <div class="total">TOTAL: R$ <%= formatCurrency(quote.total) %></div>
  </section>

  <footer>
    <div class="assinatura">Rodrigo sales</div>
  </footer>
</body>
</html>
```

> Ajuste classes e tags para combinar com o visual do PDF. Use `formatDate` e `formatCurrency` passadas pelo servidor ao renderizar.

---

## 7. CSS de impressão (dicas para ficar idêntico)

Crie `public/css/orcamento.css` com atenção para o `@page` e unidades em mm. Exemplo de pontos-chave:

```css
@page { size: A4; margin: 12mm 12mm; }
body { font-family: 'Arial', sans-serif; font-size: 12px; color: #000; }
.cabecalho { display:flex; justify-content:space-between; align-items:flex-start; }
.cabecalho .empresa h1 { font-size:18px; margin:0; text-transform:uppercase; }
.orcamento-info { text-align:right; font-weight:bold; }
h2 { text-transform:uppercase; font-size:14px; margin-top:12px; }
.item { border-bottom: 0.5px solid #000; padding:10px 0; }
.item-title { font-weight:bold; text-transform:uppercase; }
.specs { font-size:11px; line-height:1.2; margin-top:6px; }
.valor { font-weight:bold; margin-top:6px; }
.resumo { margin-top:20px; display:flex; justify-content:space-between; align-items:center; }
.total { font-size:16px; font-weight:bold; }
footer { margin-top:30px; font-size:11px; }
```

**Para chegar ao layout exato:**

* Use `@page` A4; defina margens idênticas ao PDF (medir no Acrobat: Top, Left, Right, Bottom em mm).
* Se precisar da mesma fonte exata, extraia a fonte do PDF (ou pergunte ao autor) e use `@font-face` para embutir na página.
* Ajuste espaçamentos (padding/margin) e tamanhos de fonte até que o texto e quebras coincidam.
* Exporte o PDF em alta qualidade e compare sobrepondo ao PDF referência em um visualizador com opacidade.

---

## 8. Geração do PDF (exemplo de `generator.js` com Puppeteer)

```js
const puppeteer = require('puppeteer');
const path = require('path');

async function generatePdf(htmlPath, outputPath) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`file:${path.resolve(htmlPath)}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' } });
  await browser.close();
}

module.exports = { generatePdf };
```

No servidor Express, renderize o template EJS para string e salve num arquivo temporário HTML (ou carregue via `data:`) e passe para `generatePdf`.

Exemplo rápido de rota (`routes.js`):

```js
const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { generatePdf } = require('./generator');

const router = express.Router();

router.post('/quotes', async (req, res) => {
  const quote = req.body; // validar e salvar no DB

  // renderiza o HTML
  const html = await ejs.renderFile(path.join(__dirname, '..', 'templates', 'orcamento.ejs'), { quote, company: quote.company, client: quote.client, formatDate, formatCurrency });
  const tmpHtmlPath = path.join(__dirname, '..', 'data', `tmp-${quote.quote_number}.html`);
  fs.writeFileSync(tmpHtmlPath, html, 'utf8');

  const outPath = path.join(__dirname, '..', 'data', `orcamento-${quote.quote_number}.pdf`);
  await generatePdf(tmpHtmlPath, outPath);

  res.download(outPath);
});

module.exports = router;

function formatDate(d) { /* formata DD/MM/YYYY */ }
function formatCurrency(v) { /* formata 1.234,56 */ }
```

---

## 9. Formatação (números, moeda e datas)

* Formato de moeda brasileiro: `R$ 36.971,91` (separador de milhares: `.` ; separador decimal: `,`).
* Datas no formato `DD/MM/YYYY`.

Exemplo de `formatCurrency` em JS:

```js
function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}
```

---

## 10. Testes e validação visual

1. Gere o PDF e abra no Acrobat/Chrome ao lado do PDF de referência.
2. Use ferramenta de sobreposição (ex: Photoshop ou PDF compare tools) para verificar alinhamento de blocos.
3. Ajuste `font-size`, `line-height`, `margins` e `padding` até atingir correspondência.

**Automatização (opcional):** use testes visuais (Percy, Playwright visual compare) para comparar imagens de renderização e detectar regressões.

---

## 11. Boas práticas e detalhes finais

* Armazene os templates em versão controlada (Git) para poder ajustar o CSS e o HTML com segurança.
* Se for necessário gerar muitos PDFs, use filas (BullMQ/Redis) para não sobrecarregar o Puppeteer.
* Inclua opção de gerar PDFs em background e enviar e-mail com link quando pronto.
* Verifique licença de fontes caso vá embutir tipografias comerciais.

---

## 12. Deploy

* Para pequenos volumes: VPS (DigitalOcean, AWS EC2), Node em PM2; Chrome Headless em container.
* Para escalabilidade: containerize (Docker), orquestre com Kubernetes e use uma fila para jobs de PDF.

---

## 13. Checklist rápido para ficar *idêntico* ao PDF

* [ ] Definir `A4` e margens idênticas em mm.
* [ ] Usar a mesma fonte (ou muito parecida); embutir via `@font-face` se necessário.
* [ ] Reproduzir exatamente os rótulos/títulos em maiúsculas e espaçamento entre linhas.
* [ ] Ajustar larguras das colunas e espaçamentos de bloco (padding/margin).
* [ ] Verificar pontos de quebra de página (evitar cortar informações importantes).
* [ ] Testar com dados reais do PDF de referência e ajustar até coincidirem.

---

## 14. Próximos passos que posso fazer para você

* Gerar o projeto inicial (repositório) com:

  * servidor Express básico,
  * template EJS pronto e adaptado ao seu PDF,
  * script de geração de PDF (Puppeteer) e rota para download
---

1) Analise o PDF como fonte primária

Abra o PDF no Adobe Acrobat (ou no Chrome) e medida:

margens (top/left/right/bottom) em mm,

posições aproximadas dos blocos (distância do topo em mm),

tamanhos de fonte aparentes (px/pt), espaçamento entre linhas.

Observe detalhes: famílias de fontes (serif/sans), uso de negrito, caixa alta, espaçamento entre letras (tracking), linhas divisórias (grossura), e onde há tabelas vs. blocos livres.

Anote texto fixo (rótulos, legendas) e estilos repetidos (p.ex. cabeçalho em caixa alta).

2) Fonte é crucial — use a mesma (ou a mais próxima)

Extraia a fonte do PDF (se possível) ou identifique com ferramentas como WhatFont, FontForge, ou o painel de propriedades do Acrobat.

Se for a mesma fonte, obtenha o arquivo .ttf/.woff e inclua no projeto com @font-face.

Exemplo @font-face:

@font-face{
  font-family: "Suprema";
  src: url('/assets/fonts/Suprema-Regular.woff2') format('woff2');
  font-weight: 400; font-style: normal;
}


Use variantes (regular, bold) para reproduzir negritos do PDF. Fonts diferentes quebram o “encaixe” do layout.

3) Trabalhe em unidades físicas (mm) e A4

Para impressão, use unidades físicas: mm ou cm. Evite px para dimensões principais.

Defina @page e body:

@page { size: A4; margin: 12mm; }
body { box-sizing: border-box; font-family: 'Suprema', Arial, sans-serif; font-size: 12pt; }


Defina larguras/alturas baseadas em mm para colunas, caixas e gaps.

4) Recrie a grade e a posição dos blocos

Imagine o PDF como uma grade fixa. Reproduza usando CSS Grid ou flexbox com tamanhos em mm.

Exemplo para cabeçalho com duas colunas:

.cabecalho { display: grid; grid-template-columns: 65% 35%; gap: 4mm; align-items: start; }


Use margens e paddings medidos para posicionar cada bloco exatamente.

5) Tipografia fina — tamanho, leading e tracking

Ajuste font-size, line-height (leading) e letter-spacing (tracking) até que linhas e quebras coincidam:

h1 { font-size: 18pt; line-height: 20pt; letter-spacing: 0.5px; text-transform: uppercase; }


Para cortes finos: text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; (pode afetar rasterização).

6) Tabular data (itens/valores) — use <table> ou grid com colunas fixas

Use <table> quando o alinhamento numérico é essencial (coluna de valores alinhada à direita).

Defina larguras fixas das colunas em mm para garantir que números sempre caiam na mesma posição.

table { width: 100%; border-collapse: collapse; font-size: 11pt; }
th, td { padding: 2mm 3mm; }
td.valor { text-align: right; width: 30mm; }


Formate números em servidor (R$ 36.971,91) para evitar variações de renderização.

7) Bordas, linhas e traços

Reproduza espessuras exatamente (p.ex. 1px pode não equivaler — prefira 0.5pt, 0.75pt):

.linha { border-bottom: 0.5pt solid #000; }


Para linhas tracejadas ou pontilhadas, use border-style: dashed; com border-width em pt.

8) Quebras de página e controle de fluxo

Use regras de quebra para evitar cortar blocos importantes:

.item { page-break-inside: avoid; break-inside: avoid; }


Controle onde cada página começa com page-break-before se necessário.

9) Renderização para PDF (Puppeteer / Headless Chrome)

Use Headless Chrome (Puppeteer) para converter o HTML cuidadosamente ajustado em PDF:

format: 'A4'

printBackground: true

margin conforme medido

scale (se necessário) para ajustes de precisão

await page.pdf({ path, format: 'A4', printBackground: true, margin: {top:'12mm', ...} });


Renderize a partir de file:// ou de uma URL local. Aguarde networkidle0 antes de imprimir.

10) Técnica de comparação visual (pixel-perfect tuning)

Geração iterativa:

Gere PDF a partir do HTML.

Abra o PDF gerado e o PDF referência lado a lado.

Use um editor que permita sobrepor ambos (Photoshop, GIMP) e reduza a opacidade do topo para ver diferenças de alinhamento.

Ajuste font-size, line-height, margins, padding em pequenas frações até alinhar.

Ferramentas de comparação automatizada: Playwright Visual, Percy, ou até um diff de imagens (imagem gerada vs. referência) para detectar diferenças.

11) Atalhos / truques quando não consegue casar 100%

Usar o PDF como fundo: converta a página do PDF em imagem de alta resolução e use-a como background-image e posicione os textos por cima. (Funciona bem para cópias exatas, mas torna o PDF menos flexível/dinâmico).

Converter texto em vetor no PDF (outline) e usar como imagem de fundo se a tipografia não puder ser reproduzida.

Rasterizar o PDF de referência e comparar; às vezes pequenas diferenças de antialiasing exigem rasterização semelhante.

12) Formatação de valores e datas

Formate tudo no backend para o formato brasileiro:

moeda: Number(value).toLocaleString('pt-BR', { minimumFractionDigits:2 }) → 36.971,91

data: DD/MM/YYYY

Envie ao template strings já formatadas (evita diferenças entre navegadores/locale).

13) Testes em diferentes ambientes

Teste geração em ambiente de produção (Linux) e desenvolvimento (Windows/Mac). Rendering de fontes e antialias podem variar entre sistemas.

Se tiver diferença entre dev e prod, prefira embutir as fontes e rodar Puppeteer dentro de um container Linux com as mesmas dependências.

14) Checklist final (faça na ordem)

Identifique margens e dimensões do PDF.

Obtenha/embuta a mesma fonte.

Defina @page A4 e margens em mm.

Recrie layout com grid em mm.

Use <table> para colunas de valores.

Ajuste font-size, line-height, letter-spacing (tracking).

Defina estilos de linhas com pt.

Implemente quebras de página conservadoras.

Gere PDF com printBackground: true.

Compare visualmente e afine até casar.
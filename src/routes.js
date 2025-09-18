// src/routes.js

const express = require('express');
const ejs = require('ejs');
const path = require('path');
const { generatePdf } = require('./generator'); // Verifique se o nome do arquivo 'generator.js' está correto

const router = express.Router();

// --- FUNÇÕES AUXILIARES ---

/**
 * Formata uma string de data (ex: '2025-09-12') para o padrão brasileiro (12/09/2025).
 */
function formatDate(dateString) {
    if (!dateString) return '';
    // Adicionar T00:00:00 para evitar problemas de fuso horário que podem mudar o dia
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Formata um número para o padrão de moeda brasileira (R$).
 */
function formatCurrency(number) {
    if (typeof number !== 'number') {
        return 'R$ 0,00';
    }
    return number.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}


// --- ROTA PRINCIPAL PARA GERAR O ORÇAMENTO ---

router.post('/quotes', async (req, res) => {
    try {
        console.log("-> Marcador 1: Rota /quotes iniciada."); // MARCADOR 1

        const quote = req.body; 

        // Trava de segurança e processamento dos itens
        if (quote.items && Array.isArray(quote.items)) {
            console.log("-> Marcador 2: Processando itens do orçamento."); // MARCADOR 2
            quote.items.forEach(item => {
                if (item.image_filename && item.image_filename.length > 0) {
                    const imagePath = path.join(__dirname, '..', 'public', 'uploads', item.image_filename);
                    item.image_filepath = `file:///${imagePath.replace(/\\/g, '/')}`; 
                }
            });
        }
        
        // Dados da empresa e cliente
        const company =  {
            name: "Versailles Vidraçaria",
            cnpj: "57.077.012/0001-31",
            address: "Avenida Joaquim Ribeiro, 1299, Teresina",
            email: "versailles.esquadrias@gmail.com",
            cell: "(86) 9 9597-1050",
            
        };
        const client = quote.client;

        console.log("-> Marcador 3: Renderizando o template HTML com EJS..."); // MARCADOR 3
        const html = await ejs.renderFile(
            path.join(__dirname, '..', 'templates', 'orcamento.ejs'), 
            { quote, company, client, formatDate, formatCurrency }
        );

        const outPath = path.join(__dirname, '..', 'data', `orcamento-${quote.quote_number}.pdf`);
        
        console.log("-> Marcador 4: Chamando a função generatePdf. É AQUI QUE PODE TRAVAR."); // MARCADOR 4
        await generatePdf(html, outPath);
        console.log("-> Marcador 5: PDF gerado com sucesso! Enviando o arquivo..."); // MARCADOR 5
        
        res.download(outPath, `orcamento-${quote.quote_number}.pdf`, (err) => {
            if (err) {
                console.error("Erro ao enviar o arquivo:", err);
            }
        });

    } catch (error) {
        console.error("ERRO NO BLOCO CATCH:", error);
        res.status(500).send("Erro ao gerar o orçamento em PDF.");
    }
});

module.exports = router;
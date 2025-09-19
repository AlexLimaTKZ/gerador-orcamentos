const express = require('express');
const ejs = require('ejs');
const path = require('path');
const { generatePdf } = require('./generator');
const { knex } = require('./db'); 

const router = express.Router();

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('pt-BR');
};
const formatCurrency = (value) => {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ROTA PARA CRIAR ORÇAMENTO, SALVAR NO BANCO E GERAR PDF
router.post('/quotes', async (req, res) => {
    const quoteData = req.body;
    try {
        // Usa uma transação para garantir que tudo seja salvo ou nada seja salvo
        await knex.transaction(async trx => {
            // Primeiro, insere o cliente. Se já existir um cliente com o mesmo nome, atualiza os dados.
            const [clientResult] = await trx('clients').insert({
                name: quoteData.client.name,
                address: quoteData.client.address,
                phone: quoteData.client.phone
            }).returning('id').onConflict('name').merge();
            
            const clientId = clientResult.id;

            // Insere o orçamento principal, ligando ao ID do cliente
            const [quoteResult] = await trx('quotes').insert({
                quote_number: quoteData.quote_number,
                client_id: clientId,
                date: quoteData.date,
                delivery_date: quoteData.delivery_date || null,
                valid_until: quoteData.valid_until || null,
                total: quoteData.total
            }).returning('id');

            const savedQuoteId = quoteResult.id;

            // Insere os itens do orçamento, se houver algum
            if (quoteData.items && quoteData.items.length > 0) {
                const itemsToInsert = quoteData.items.map(item => ({
                    quote_id: savedQuoteId,
                    title: item.title,
                    image_filename: item.image_filename,
                    width: item.width,
                    height: item.height,
                    glass: item.glass,
                    aluminum_color: item.aluminum,
                    hardware_color: item.hardware,
                    quantity: item.quantity,
                    total_price: item.total_price
                }));
                await trx('quote_items').insert(itemsToInsert);
            }
        });
        
        console.log('Orçamento salvo com sucesso no banco de dados.');

        // Se salvou tudo certo, agora gera o PDF
        const html = await ejs.renderFile(
            path.join(__dirname, '..', 'templates', 'orcamento.ejs'), 
            { quote: quoteData, company: quoteData.company, client: quoteData.client, formatDate, formatCurrency }
        );

        const outPath = path.join(__dirname, '..', 'data', `orcamento-${quoteData.quote_number}.pdf`);
        await generatePdf(html, outPath);
        res.download(outPath);

    } catch (error) {
        console.error("Erro ao salvar ou gerar orçamento:", error);
        res.status(500).send("Erro ao processar o orçamento. Verifique o console do servidor.");
    }
});

// ROTAS DA API PARA LISTAR E EXCLUIR
router.get('/api/orcamentos', async (req, res) => {
    try {
        const orcamentos = await knex('quotes')
            .join('clients', 'quotes.client_id', '=', 'clients.id')
            .select('quotes.id', 'quotes.quote_number', 'clients.name as client_name', 'quotes.date', 'quotes.total')
            .orderBy('quotes.id', 'desc');
        res.json(orcamentos);
    } catch (error) {
        console.error("Erro ao listar orçamentos:", error);
        res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
    }
});

router.get('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await knex('quotes').where('quotes.id', id).first();
        if (!quote) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }
        const client = await knex('clients').where('id', quote.client_id).first();
        const items = await knex('quote_items').where('quote_id', id);
        const formattedItems = items.map(item => ({
            image_filename: item.image_filename,
            title: item.title,
            width: item.width,
            height: item.height,
            glass: item.glass,
            aluminum: item.aluminum_color,
            hardware: item.hardware_color,
            quantity: item.quantity,
            total_price: item.total_price
        }));
        res.json({ ...quote, client, items: formattedItems });
    } catch (error) {
        console.error("Erro ao buscar orçamento:", error);
        res.status(500).json({ error: 'Erro ao buscar orçamento.' });
    }
});

router.delete('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const numDeleted = await knex('quotes').where('id', id).del();
        if (numDeleted === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }
        res.json({ message: 'Orçamento excluído com sucesso.' });
    } catch (error) {
        console.error("Erro ao deletar orçamento:", error);
        res.status(500).json({ error: 'Erro ao deletar orçamento.' });
    }
});


module.exports = router;
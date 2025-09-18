const express = require('express');
const path = require('path');
const fs = require('fs');
const routes = require('./src/routes');
const { setupDatabase } = require('./src/db');

const app = express();
const port = 3000;

app.use(express.json());

const publicDirectoryPath = path.join(__dirname, 'public');
app.use(express.static(publicDirectoryPath));

app.get('/api/images', (req, res) => {
    const imagesPath = path.join(publicDirectoryPath, 'uploads');
    
    fs.readdir(imagesPath, (err, files) => {
        if (err) {
            console.error(`[API] Erro ao ler o diretório: ${imagesPath}`, err);
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            return res.status(500).json({ error: 'Não foi possível listar as imagens.' });
        }
        
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        console.log("[API] Enviando a seguinte lista de imagens:", imageFiles);
        res.json(imageFiles);
    });
});

app.use('/', routes);

setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Acesse o formulário em http://localhost:${port}/`);
  });
}).catch(err => {
    console.error("Erro ao iniciar o banco de dados:", err)
});
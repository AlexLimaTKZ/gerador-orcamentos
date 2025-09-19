const knex = require('knex');
const knexConfig = require('../knexfile'); // Sobe um nível para achar o knexfile.js

// Inicializa o Knex com a configuração 'development'
const dbInstance = knex(knexConfig.development);

// A função setupDatabase agora simplesmente roda as migrations
async function setupDatabase() {
  console.log("Verificando e executando migrations do banco de dados...");
  try {
    await dbInstance.migrate.latest();
    console.log("Banco de dados pronto.");
  } catch (error) {
    console.error("Erro ao rodar migrations:", error);
    process.exit(1); // Sai se o DB falhar
  }
}

// Exporta a instância do knex para ser usada nas rotas
// e a função de setup
module.exports = {
  knex: dbInstance,
  setupDatabase
};
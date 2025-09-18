
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data/database.sqlite',
  },
  useNullAsDefault: true,
});

async function setupDatabase() {
  const hasCompanies = await knex.schema.hasTable('companies');
  if (!hasCompanies) {
    await knex.schema.createTable('companies', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('cnpj');
      table.string('address');
      table.string('email');
      table.string('phone');
      table.string('logo_path');
      table.string('system_name');
    });
  }

  const hasClients = await knex.schema.hasTable('clients');
  if (!hasClients) {
    await knex.schema.createTable('clients', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('address');
      table.string('phone');
      table.string('email');
    });
  }

  const hasQuotes = await knex.schema.hasTable('quotes');
  if (!hasQuotes) {
    await knex.schema.createTable('quotes', (table) => {
      table.increments('id').primary();
      table.string('quote_number');
      table.integer('company_id').unsigned().references('id').inTable('companies');
      table.integer('client_id').unsigned().references('id').inTable('clients');
      table.date('date');
      table.date('delivery_date');
      table.date('valid_until');
      table.decimal('total', 14, 2);
      table.timestamps(true, true);
    });
  }

  const hasQuoteItems = await knex.schema.hasTable('quote_items');
  if (!hasQuoteItems) {
    await knex.schema.createTable('quote_items', (table) => {
      table.increments('id').primary();
      table.integer('quote_id').unsigned().references('id').inTable('quotes');
      table.integer('item_index');
      table.string('title');
      table.string('description');
      table.integer('width_mm');
      table.integer('height_mm');
      table.string('glass');
      table.string('aluminum_color');
      table.string('hardware_color');
      table.integer('quantity');
      table.decimal('unit_price', 14, 2);
      table.decimal('total_price', 14, 2);
    });
  }

  const hasSettings = await knex.schema.hasTable('settings');
  if (!hasSettings) {
    await knex.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.string('key').unique();
      table.string('value');
    });
  }
}

module.exports = { knex, setupDatabase };

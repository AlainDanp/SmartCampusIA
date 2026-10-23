// Initialise la base (schéma + données de démo). Usage : npm run db:init
// Sur AWS : à lancer une fois depuis l'EC2 → docker compose run --rm app npm run db:init
const fs = require('fs');
const path = require('path');
require('../src/env');
const { pool } = require('../src/db');

(async () => {
  const dir = path.join(__dirname, '../db');
  for (const file of ['01-schema.sql', '02-seed.sql']) {
    console.log(`→ ${file}`);
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM ticket');
  console.log(`Base initialisée : ${rows[0].n} tickets de démo.`);
  await pool.end();
})().catch(async (err) => {
  console.error('Échec de l\'initialisation :', err.message);
  await pool.end();
  process.exit(1);
});

// Charge api/.env s'il existe (Node >= 20.12), sans dépendance externe.
// En Docker, les variables viennent de docker-compose : ce fichier ne fait alors rien.
const path = require('path');

try {
  if (typeof process.loadEnvFile === 'function') process.loadEnvFile(path.join(__dirname, '../.env'));
} catch {
  /* pas de .env : on garde les variables d'environnement existantes */
}

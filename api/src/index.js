require('./env');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { authenticate, requireRole } = require('./middleware/auth');
const storage = require('./services/storage');
const assistant = require('./services/assistant');
const relance = require('./jobs/relance');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', stockage: storage.mode, assistant: assistant.moteur() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/referentiels', authenticate, require('./routes/referentiels'));
app.use('/api/tickets', authenticate, require('./routes/tickets'));
app.use('/api/assistant', authenticate, require('./routes/assistant'));
app.use('/api/stats', authenticate, requireRole('ADMIN'), require('./routes/stats'));
app.use('/api/profil', authenticate, require('./routes/profil'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Route inconnue' }));

// Architecture validée : Express sert aussi le front React compilé (front/dist), sans proxy.
const FRONT_DIST = process.env.FRONT_DIST || path.join(__dirname, '../../front/dist');
if (fs.existsSync(path.join(FRONT_DIST, 'index.html'))) {
  app.use(express.static(FRONT_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(FRONT_DIST, 'index.html'))); // routes React
}

// Gestionnaire d'erreurs : log complet côté serveur, message neutre côté client
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[erreur] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`SmartCampus sur :${port} — stockage ${storage.mode} — assistant ${assistant.moteur()}`
      + ` — front ${fs.existsSync(FRONT_DIST) ? 'servi' : 'non compilé (npm run build dans front/)'}`);
    relance.demarrer(); // RG-06 : tâche 24 h
  });
}

module.exports = app;

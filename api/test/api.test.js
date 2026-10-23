// Tests d'API sur les règles métier clés (QE).
// Prérequis : base de test initialisée → npm run db:init (ATTENTION : remet la base à zéro)
// Lancement : npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/db');

const tokens = {};
async function login(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'demo1234' });
  assert.strictEqual(res.status, 200, `login ${email}`);
  return res.body.token;
}
const auth = (who) => ({ Authorization: `Bearer ${tokens[who]}` });

before(async () => {
  tokens.lea = await login('lea@campus.fr');
  tokens.tom = await login('tom@campus.fr');
  tokens.karim = await login('karim@campus.fr');
  tokens.julie = await login('julie@campus.fr');
  tokens.sophie = await login('sophie@campus.fr');
});
after(() => pool.end());

test('Login refusé avec un mauvais mot de passe', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'lea@campus.fr', password: 'faux' });
  assert.strictEqual(res.status, 401);
});

test('RG-01 : champ obligatoire manquant → 400 et champ signalé', async () => {
  const res = await request(app).post('/api/tickets').set(auth('lea'))
    .field('categorieId', '1').field('description', 'Test sans lieu');
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.champs.lieuId);
});

test('RG-02 : photo au mauvais format refusée', async () => {
  const res = await request(app).post('/api/tickets').set(auth('lea'))
    .field('categorieId', '1').field('lieuId', '4').field('description', 'Avec PDF')
    .attach('photo', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.champs.photo);
});

let ticketId;
test('US-01 / RG-04 / RG-13 : création → NOUVEAU, n° unique, assigné au référent', async () => {
  const res = await request(app).post('/api/tickets').set(auth('lea'))
    .field('categorieId', '1').field('lieuId', '4').field('description', 'Vidéoprojecteur B204 en panne');
  assert.strictEqual(res.status, 201);
  assert.match(res.body.numero, /^INC-\d{5}$/);
  assert.strictEqual(res.body.statut, 'NOUVEAU');
  ticketId = res.body.id;
  const file = await request(app).get('/api/tickets/assigned').set(auth('karim'));
  assert.ok(file.body.some((t) => t.id === ticketId), 'présent dans la file de Karim');
});

test('RG-03 : catégorie Sécurité → priorité CRITIQUE', async () => {
  const res = await request(app).post('/api/tickets').set(auth('lea'))
    .field('categorieId', '5').field('lieuId', '8').field('description', 'Câble électrique dénudé');
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.priorite, 'CRITIQUE');
});

test('RG-05 : un étudiant ne voit pas le ticket d\'un autre', async () => {
  const res = await request(app).get(`/api/tickets/${ticketId}`).set(auth('tom'));
  assert.strictEqual(res.status, 403);
  const mine = await request(app).get('/api/tickets/mine').set(auth('tom'));
  assert.ok(mine.body.every((t) => t.auteurId !== 1));
});

test('RG-07 : un technicien non assigné ne peut pas modifier', async () => {
  const res = await request(app).patch(`/api/tickets/${ticketId}/status`).set(auth('julie')).send({ statut: 'EN_COURS' });
  assert.strictEqual(res.status, 403);
});

test('RG-07 : Nouveau → Résolu en direct interdit', async () => {
  const res = await request(app).patch(`/api/tickets/${ticketId}/status`).set(auth('karim'))
    .send({ statut: 'RESOLU', commentaire: 'ok' });
  assert.strictEqual(res.status, 409);
});

test('RG-08 : passage à Résolu sans commentaire refusé, puis accepté avec', async () => {
  let res = await request(app).patch(`/api/tickets/${ticketId}/status`).set(auth('karim')).send({ statut: 'EN_COURS' });
  assert.strictEqual(res.status, 200);
  res = await request(app).patch(`/api/tickets/${ticketId}/status`).set(auth('karim')).send({ statut: 'RESOLU' });
  assert.strictEqual(res.status, 400);
  res = await request(app).patch(`/api/tickets/${ticketId}/status`).set(auth('karim'))
    .send({ statut: 'RESOLU', commentaire: 'Lampe du vidéoprojecteur remplacée' });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.dateResolution, 'RG-11 : date de résolution renseignée');
});

test('US-02 : Léa voit l\'historique complet avec le commentaire de Karim', async () => {
  const res = await request(app).get(`/api/tickets/${ticketId}`).set(auth('lea'));
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body.historique.map((h) => h.nouveauStatut), ['NOUVEAU', 'EN_COURS', 'RESOLU']);
  assert.strictEqual(res.body.historique[2].commentaire, 'Lampe du vidéoprojecteur remplacée');
});

test('RG-09 : question hors FAQ → « je ne sais pas » + proposition de signalement', async () => {
  const res = await request(app).post('/api/assistant/chat').set(auth('lea')).send({ message: 'Quel est le menu de la cantine ?' });
  assert.strictEqual(res.status, 200);
  assert.match(res.body.reponse, /ne sais pas/i);
  assert.strictEqual(res.body.proposerSignalement, true);
});

test('US-05 : incident décrit à l\'assistant → suggestion pré-remplie (A12, réseau)', async () => {
  const res = await request(app).post('/api/assistant/chat').set(auth('lea'))
    .send({ message: 'Le Wi-Fi ne marche pas du tout en salle A12' });
  assert.strictEqual(res.body.proposerSignalement, true);
  assert.strictEqual(res.body.suggestion.lieuId, 1);
  assert.strictEqual(res.body.suggestion.categorieId, 2);
});

test('RG-12 : tableau de bord réservé à l\'admin', async () => {
  assert.strictEqual((await request(app).get('/api/stats').set(auth('lea'))).status, 403);
  assert.strictEqual((await request(app).get('/api/stats').set(auth('karim'))).status, 403);
  const res = await request(app).get('/api/stats?periode=semestre').set(auth('sophie'));
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.total > 0);
  assert.ok(res.body.delaiMoyenHeures > 0);
});

test('RG-06 : un ticket « Nouveau » depuis plus de 24 h est relancé une seule fois', async () => {
  const { relancer, MESSAGE } = require('../src/jobs/relance');
  const { rows } = await pool.query(
    `INSERT INTO ticket (auteur_id, technicien_id, categorie_id, lieu_id, description, priorite, date_creation)
     VALUES (1, 3, 1, 1, 'Ticket ancien', 'NORMALE', now() - interval '30 hours') RETURNING id`,
  );
  const id = rows[0].id;
  assert.ok(await relancer() >= 1);
  assert.strictEqual(await relancer(), 0, 'pas de double relance');
  const res = await request(app).get(`/api/tickets/${id}`).set(auth('lea'));
  assert.strictEqual(res.body.enRetard, true);
  const derniere = res.body.historique.at(-1);
  assert.strictEqual(derniere.commentaire, MESSAGE);
  assert.strictEqual(derniere.auteur, 'Système');
});

test('Profil : informations du compte et statistiques selon le rôle', async () => {
  const lea = await request(app).get('/api/profil').set(auth('lea'));
  assert.strictEqual(lea.status, 200);
  assert.strictEqual(lea.body.email, 'lea@campus.fr');
  assert.ok(lea.body.stats.total > 0);
  assert.strictEqual(lea.body.mot_de_passe, undefined, 'le hash ne doit jamais sortir');
  const karim = await request(app).get('/api/profil').set(auth('karim'));
  assert.deepStrictEqual(karim.body.categories, ['Matériel défectueux', 'Problème réseau']);
});

test('Profil : changement de mot de passe (refus si actuel faux, puis succès)', async () => {
  let res = await request(app).patch('/api/profil/mot-de-passe').set(auth('tom')).send({ actuel: 'faux', nouveau: 'nouveau-mdp-2026' });
  assert.strictEqual(res.status, 400);
  res = await request(app).patch('/api/profil/mot-de-passe').set(auth('tom')).send({ actuel: 'demo1234', nouveau: 'court' });
  assert.strictEqual(res.status, 400);
  res = await request(app).patch('/api/profil/mot-de-passe').set(auth('tom')).send({ actuel: 'demo1234', nouveau: 'nouveau-mdp-2026' });
  assert.strictEqual(res.status, 200);
  const login = await request(app).post('/api/auth/login').send({ email: 'tom@campus.fr', password: 'nouveau-mdp-2026' });
  assert.strictEqual(login.status, 200);
  // Remise en état pour la démo
  await request(app).patch('/api/profil/mot-de-passe').set(auth('tom')).send({ actuel: 'nouveau-mdp-2026', nouveau: 'demo1234' });
});

test('Assistant : une salutation reçoit une réponse polie, sans proposition de signalement', async () => {
  const res = await request(app).post('/api/assistant/chat').set(auth('lea')).send({ message: 'Bonjour !' });
  assert.strictEqual(res.status, 200);
  assert.match(res.body.reponse, /Bonjour/);
  assert.strictEqual(res.body.proposerSignalement, false);
});

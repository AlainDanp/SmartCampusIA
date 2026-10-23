const router = require('express').Router();
const multer = require('multer');
const { query, transaction } = require('../db');
const { requireRole } = require('../middleware/auth');
const storage = require('../services/storage');

const MAX_PHOTO_MB = Number(process.env.MAX_PHOTO_MB || 5);

// ─── Upload photo (RG-02) ──────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png'].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('La photo doit être au format JPG ou PNG')),
});

function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `La photo dépasse ${MAX_PHOTO_MB} Mo`
      : err.message;
    return res.status(400).json({ error: message, champs: { photo: message } });
  });
}

// ─── Requêtes communes ─────────────────────────────────────────────────
const SELECT_TICKET = `
  SELECT t.id, t.numero, t.description, t.statut, t.priorite,
         t.date_creation AS "dateCreation", t.date_maj AS "dateMaj", t.date_resolution AS "dateResolution",
         t.auteur_id AS "auteurId", t.technicien_id AS "technicienId",
         (t.photo_key IS NOT NULL) AS "aPhoto",
         (t.statut = 'NOUVEAU' AND t.date_creation < now() - interval '24 hours') AS "enRetard",  -- RG-06
         c.id AS "categorieId", c.libelle AS categorie,
         l.id AS "lieuId", l.batiment || ' · ' || l.salle AS lieu,
         a.nom AS auteur, tech.nom AS technicien
  FROM ticket t
  JOIN categorie c   ON c.id = t.categorie_id
  JOIN lieu l        ON l.id = t.lieu_id
  JOIN utilisateur a ON a.id = t.auteur_id
  LEFT JOIN utilisateur tech ON tech.id = t.technicien_id`;

const isInt = (v) => /^\d+$/.test(String(v ?? ''));

// RG-05 (étudiant = ses tickets) / RG-14 (technicien = tickets assignés) / admin = tout
function canAccess(user, ticket) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'ETUDIANT') return ticket.auteurId === user.id;
  if (user.role === 'TECHNICIEN') return ticket.technicienId === user.id;
  return false;
}

async function loadTicketForUser(req, res) {
  if (!isInt(req.params.id)) {
    res.status(400).json({ error: 'Identifiant de ticket invalide' });
    return null;
  }
  const { rows } = await query(`${SELECT_TICKET} WHERE t.id = $1`, [req.params.id]);
  const ticket = rows[0];
  if (!ticket) {
    res.status(404).json({ error: 'Ticket introuvable' });
    return null;
  }
  if (!canAccess(req.user, ticket)) {
    res.status(403).json({ error: "Vous n'avez pas accès à ce ticket" });
    return null;
  }
  return ticket;
}

// ─── US-01 : POST /api/tickets (multipart : categorieId, lieuId, description, photo?) ───
router.post('/', requireRole('ETUDIANT'), uploadPhoto, async (req, res, next) => {
  try {
    const { categorieId, lieuId } = req.body;
    const description = (req.body.description || '').trim();

    // RG-01 : champs obligatoires
    const champs = {};
    if (!isInt(categorieId)) champs.categorieId = 'La catégorie est obligatoire';
    if (!isInt(lieuId)) champs.lieuId = 'Le lieu est obligatoire';
    if (!description) champs.description = 'La description est obligatoire';
    if (Object.keys(champs).length) {
      return res.status(400).json({ error: 'Champs obligatoires manquants', champs });
    }

    const [cat, lieu] = await Promise.all([
      query('SELECT * FROM categorie WHERE id = $1', [categorieId]),
      query('SELECT id FROM lieu WHERE id = $1', [lieuId]),
    ]);
    if (!cat.rows[0]) return res.status(400).json({ error: 'Catégorie inconnue', champs: { categorieId: 'Catégorie inconnue' } });
    if (!lieu.rows[0]) return res.status(400).json({ error: 'Lieu inconnu', champs: { lieuId: 'Lieu inconnu' } });
    const categorie = cat.rows[0];

    const photoKey = req.file ? await storage.savePhoto(req.file) : null;

    const ticket = await transaction(async (client) => {
      // RG-04 : statut NOUVEAU + priorité de la catégorie (RG-03 : Sécurité → CRITIQUE)
      // RG-13 : assignation automatique au technicien référent de la catégorie
      const { rows } = await client.query(
        `INSERT INTO ticket (auteur_id, technicien_id, categorie_id, lieu_id, description, photo_key, priorite)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, numero, statut, priorite, date_creation AS "dateCreation"`,
        [req.user.id, categorie.technicien_id, categorie.id, lieuId, description, photoKey, categorie.priorite_defaut],
      );
      await client.query(
        `INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire)
         VALUES ($1, $2, NULL, 'NOUVEAU', 'Ticket créé')`,
        [rows[0].id, req.user.id],
      );
      return rows[0];
    });

    // RG-03 : alerte immédiate (MVP : log + bandeau sur le tableau de bord ; bonus : e-mail SES)
    if (ticket.priorite === 'CRITIQUE') {
      console.warn(`[ALERTE SÉCURITÉ] ${ticket.numero} créé — catégorie ${categorie.libelle}`);
    }

    return res.status(201).json(ticket);
  } catch (err) {
    return next(err);
  }
});

// ─── US-02 : GET /api/tickets/mine?statut= ─────────────────────────────
router.get('/mine', requireRole('ETUDIANT'), async (req, res, next) => {
  try {
    const params = [req.user.id];
    let filtre = '';
    if (req.query.statut) {
      params.push(req.query.statut);
      filtre = ' AND t.statut::text = $2';
    }
    const { rows } = await query(
      `${SELECT_TICKET} WHERE t.auteur_id = $1${filtre} ORDER BY t.date_creation DESC`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── US-03 : GET /api/tickets/assigned?tous=1 ──────────────────────────
// Technicien : ses tickets (RG-14) ; admin : tous. Tri : priorité puis ancienneté.
router.get('/assigned', requireRole('TECHNICIEN', 'ADMIN'), async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];
    if (req.user.role === 'TECHNICIEN') {
      params.push(req.user.id);
      conditions.push(`t.technicien_id = $${params.length}`);
    }
    if (req.query.tous !== '1') conditions.push("t.statut <> 'RESOLU'");
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `${SELECT_TICKET} ${where} ORDER BY t.priorite DESC, t.date_creation ASC`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── US-02 : GET /api/tickets/:id (détail + historique) ────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await loadTicketForUser(req, res);
    if (!ticket) return undefined;
    const { rows: historique } = await query(
      `SELECT h.id, h.ancien_statut AS "ancienStatut", h.nouveau_statut AS "nouveauStatut",
              h.commentaire, h.date, COALESCE(u.nom, 'Système') AS auteur, u.role
       FROM historique h LEFT JOIN utilisateur u ON u.id = h.auteur_id
       WHERE h.ticket_id = $1 ORDER BY h.date ASC, h.id ASC`,
      [ticket.id],
    );
    return res.json({ ...ticket, historique });
  } catch (err) {
    return next(err);
  }
});

// ─── GET /api/tickets/:id/photo (relais du fichier après contrôle d'accès) ───
router.get('/:id/photo', async (req, res, next) => {
  try {
    const ticket = await loadTicketForUser(req, res);
    if (!ticket) return undefined;
    const { rows } = await query('SELECT photo_key FROM ticket WHERE id = $1', [ticket.id]);
    if (!rows[0].photo_key) return res.status(404).json({ error: 'Aucune photo pour ce ticket' });
    const { stream, contentType } = await storage.readPhoto(rows[0].photo_key);
    res.type(contentType);
    stream.on('error', next);
    return stream.pipe(res);
  } catch (err) {
    return next(err);
  }
});

// ─── US-03 : PATCH /api/tickets/:id/status  { statut, commentaire } ────
const TRANSITIONS = { NOUVEAU: 'EN_COURS', EN_COURS: 'RESOLU' }; // RG-07

router.patch('/:id/status', requireRole('TECHNICIEN', 'ADMIN'), async (req, res, next) => {
  try {
    const ticket = await loadTicketForUser(req, res); // RG-07 : technicien assigné ou admin
    if (!ticket) return undefined;

    const { statut } = req.body || {};
    const commentaire = (req.body?.commentaire || '').trim();

    if (TRANSITIONS[ticket.statut] !== statut) {
      const attendu = TRANSITIONS[ticket.statut];
      return res.status(409).json({
        error: attendu
          ? `Transition interdite : depuis « ${ticket.statut} », seul le passage à « ${attendu} » est possible`
          : 'Ce ticket est déjà résolu et ne peut plus être modifié',
      });
    }
    // RG-08 : commentaire obligatoire pour résoudre
    if (statut === 'RESOLU' && !commentaire) {
      return res.status(400).json({
        error: 'Un commentaire est obligatoire pour passer le ticket à « Résolu »',
        champs: { commentaire: 'Commentaire obligatoire' },
      });
    }

    const updated = await transaction(async (client) => {
      // Verrou + re-vérification du statut pour éviter deux mises à jour concurrentes
      const { rows } = await client.query(
        `UPDATE ticket
         SET statut = $2, date_maj = now(),
             date_resolution = CASE WHEN $2::statut_t = 'RESOLU' THEN now() ELSE NULL END
         WHERE id = $1 AND statut = $3
         RETURNING id, numero, statut, date_maj AS "dateMaj", date_resolution AS "dateResolution"`,
        [ticket.id, statut, ticket.statut],
      );
      if (!rows[0]) return null;
      await client.query(
        `INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire)
         VALUES ($1, $2, $3, $4, $5)`,
        [ticket.id, req.user.id, ticket.statut, statut, commentaire || null],
      );
      return rows[0];
    });

    if (!updated) return res.status(409).json({ error: 'Le ticket a été modifié entre-temps, rechargez la page' });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

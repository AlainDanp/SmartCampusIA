const router = require('express').Router();
const { query } = require('../db');
const { signToken, verifyPassword, authenticate } = require('../middleware/auth');

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe obligatoires' });

    const { rows } = await query('SELECT * FROM utilisateur WHERE email = $1', [String(email).trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.mot_de_passe)) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    return res.json({
      token: signToken(user),
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json(req.user));

module.exports = router;

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-a-changer';

// Mots de passe : scrypt (module natif Node, aucune dépendance)
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 32).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored).split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, nom: user.nom }, SECRET, { expiresIn: '8h' });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    req.user = jwt.verify(token, SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

// RBAC : requireRole('ADMIN'), requireRole('TECHNICIEN', 'ADMIN')…
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'Accès refusé pour votre rôle' });

module.exports = { authenticate, requireRole, signToken, hashPassword, verifyPassword };

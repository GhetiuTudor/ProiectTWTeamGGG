const jwt = require('jsonwebtoken');

// Verifica validitatea tokenului JWT din antetul cererii pentru a proteja rutele
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'Token lipsa. Autentificare necesara.' });
  }

  try {
    // Presupunem formatul "Bearer <token>"
    const bearer = token.split(' ')[1];
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET || 'secret_key_super_sigura');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};

module.exports = verifyToken;
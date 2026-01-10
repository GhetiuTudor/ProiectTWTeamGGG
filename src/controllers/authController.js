const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inregistreaza un utilizator nou si cripteaza parola
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'PARTICIPANT'
      }
    });

    res.json({ message: 'User creat cu succes!', userId: newUser.id });
  } catch (error) {
    res.status(400).json({ error: 'Emailul exista deja sau date invalide.' });
  }
};

// Autentifica utilizatorul verificand emailul si parola apoi genereaza un token JWT
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const foundUser = await prisma.user.findUnique({ where: { email } });
    if (!foundUser) return res.status(404).json({ error: 'User inexistent' });

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Parola incorecta' });

    const token = jwt.sign(
      { id: foundUser.id, role: foundUser.role },
      process.env.JWT_SECRET || 'secret_key_super_sigura',
      { expiresIn: '24h' }
    );

    res.json({ token, role: foundUser.role, name: foundUser.name });
  } catch (error) {
    res.status(500).json({ error: 'Eroare server' });
  }
};
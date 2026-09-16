const prisma = require('../config/db');
const { hashPassword, comparePassword, generateTokens } = require('../services/tokenService');

/**
 * POST /api/auth/user/signup
 * Body: { name, email, password }
 */
async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'single' },
    });
    const tokens = generateTokens(user);
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/user/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const tokens = generateTokens(user);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { signup, login };

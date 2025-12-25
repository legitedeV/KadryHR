const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Używamy COOKIES, żeby backend widział token przez nginx
function sendAuthCookie(res, token) {
  // U CIEBIE TERAZ HTTP, więc secure = false.
  // Jak tylko włączysz https → ustaw tu secure: true.
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false, // <--- ważne na obecnym etapie
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

module.exports = {
  signToken,
  sendAuthCookie,
};

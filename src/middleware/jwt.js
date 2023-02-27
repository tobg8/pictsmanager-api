const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const token = jwt.sign({ email: user.email, id: user._id }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
  return token;
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).send('Invalid token');
      } else {
        req.user = decodedToken;
        next();
      }
    });
  } else {
    return res.status(401).send('No token provided');
  }
}

module.exports = { generateToken, verifyToken };
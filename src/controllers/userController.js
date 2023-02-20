const dbConfig = require("../config/db");
const bcrypt = require('bcryptjs');

const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient(dbConfig.url);
const db = mongoClient.db(dbConfig.database);

const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: "Please provide email & password",
    });
  }

  await mongoClient.connect();

  const user = await db.collection('users').findOne({ email: email });
  if (user) {
    return res.status(409).send({ message: 'user already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection('users').insertOne({ email: email, password: hashedPassword });

  return res.status(201).send({
    message: "user created",
  });
}

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: "Please provide email & password",
    });
  }

  // Connect to the database
  await mongoClient.connect();

  // Find the user in the database
  const user = await db.collection('users').findOne({ email: email });
  if (!user) {
    return res.status(404).send('User not found');
  }

  // Compare the password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Invalid credentials');
  }


  // ! Faire le token jwt ici

  return res.status(200).send({
    email: user.email,
    id: user._id
  })
}

module.exports = {
  signup,
  login
};

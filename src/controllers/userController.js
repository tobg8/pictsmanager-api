import { hash, compare } from 'bcryptjs';
import { MongoClient } from "mongodb";

import { url, database } from "../config/db";

const mongoClient = new MongoClient(url);
const db = mongoClient.db(database);

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

  const hashedPassword = await hash(password, 10);

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
  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Invalid credentials');
  }


  // ! Faire le token jwt ici

  return res.status(200).send({
    email: user.email,
    id: user._id
  })
}

export default {
  signup,
  login
};

const { ObjectId } = require('mongodb');
const { MongoClient } = require("mongodb");

const { url: _url, database: _database } = require("../../config/db");

const mongoClient = new MongoClient(_url);

const authentifyOwnershipOnBucket = async (userID, bucketName) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db(_database);

    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});

    // Si j'ai pas de bucket, ca veut dire je le crée je deviens owner donc je laisse passer
    if (bucket && bucket?.metadata?.userID !== userID) {
      return false
    }

    return true
  } catch (error) {
    console.log('error in authentifyOwnershipBucket', error)
  }
}

const checkAccessToBucket = async (bucketName, userID) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db(_database);

    const bucket = await database.collection(`${bucketName}.files`).findOne({});

    if (!bucket) {
      return false
    }

    const bucketAccess = bucket.metadata.sharedUsers.find((id) => id === userID)

    if (!bucketAccess && bucket.metadata.userID !== userID) {
      return false
    }

    return true
  } catch (error) {
    console.log('error in authentifyOwnershipBucket', error)
  }
}

module.exports = { authentifyOwnershipOnBucket, checkAccessToBucket }
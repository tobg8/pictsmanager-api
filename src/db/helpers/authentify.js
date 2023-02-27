const { ObjectId } = require('mongodb');
const { MongoClient } = require("mongodb");

const { url: _url, database: _database } = require("../../config/db");

const mongoClient = new MongoClient(_url);

const authentifyOwnershipOnBucket = async (userID, bucketName) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db(_database);

    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});
    console.log(bucket)
    console.log(userID, bucket.metadata.userID)
    // Si j'ai pas de bucket, ca veut dire je le crée je deviens owner donc je laisse passer
    if (bucket && bucket.metadata.userID !== userID) {
      return false
    }

    return bucket
  } catch (error) {
    console.log('🙂')
    console.log('error in authentifyOwnershipBucket', error)
  }

}

module.exports = { authentifyOwnershipOnBucket }

const { ObjectId } = require('mongodb');
const { MongoClient } = require("mongodb");
const { GridFSBucket } = require("mongodb");

const upload = require("../middleware/upload");
const { url: _url, database: _database } = require("../config/db");
const { authentifyOwnershipOnBucket } = require('../db/helpers/authentify')

const baseUrl = "http://localhost:8080/";
const mongoClient = new MongoClient(_url);

const uploadFiles = async (req, res) => {
  try {
    const { id: userID } = req.user

    const { bucketName } = req.params
    if (!bucketName) {
      return res.status(400).json({ error: "Please provide bucketName" });
    }

    await mongoClient.connect();
    const database = mongoClient.db(_database);

    // Vérifier si l'utilisateur existe
    const user = await database.collection('users').findOne({ _id: new ObjectId(userID) });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur est propriétaire du bucket
    const bucket = await authentifyOwnershipOnBucket(userID, bucketName)
    if (bucket === false) {
      return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
    }

    await upload(req, res)

    // Vérifier l'envoi de 1 à 10 photos
    if (req.files.length <= 0) {
      return res
        .status(400)
        .send({ message: "You must select at least 1 file" });
    }

    return res.send({
      message: req.files,
    });
  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send({
        message: "Too many files to upload.",
      });
    }
    return res.send({
      message: `${error}`,
    });
  }
};

const updateBucket = async (req, res) => {
  try {

    const { userID, bucketName } = req.body
    if (!userID || !bucketName) {
      return res.status(400).json({ error: "Please provide userID and bucketName" });
    }

    const { sharedUserID } = req.params
    if (!sharedUserID) {
      return res.status(400).json({ error: "Please provide the userID you want to share bucket with" });
    }

    await mongoClient.connect();
    const database = mongoClient.db(_database);

    // Vérifier si l'utilisateur existe
    const user = await database.collection('users').findOne({ _id: new ObjectId(userID) });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // ! Vérifier que le sharedUserID existe, que l'user existe

    // Vérifier si l'utilisateur est propriétaire du bucket
    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});
    if (!bucket || bucket.metadata.userID !== userID) {
      return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
    }

    // Update the metadata to add the new shared user ID
    const result = await database.collection(`${userID}/${bucketName}.files`).updateMany(
      { "metadata.userID": userID },
      { $push: { "metadata.sharedUsers": req.params.sharedUserID } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'Failed to update metadata' });
    }
    return res.status(200).json({ message: `userID: ${req.params.sharedUserID} has access to bucket ${userID}/${bucketName}` })
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      message: error
    })
  }
};

const getListFiles = async (req, res) => {
  try {
    await mongoClient.connect();

    const { id: userID } = req.user
    const { bucketName } = req.params
    if (!bucketName) {
      return res.status(400).json({ error: "Please provide bucketName" });
    }

    const { sharedUserID } = req.body;

    const database = mongoClient.db(_database);

    // Vérifier que l'on a accès au bucket
    // ! Il faudra vérifier que l'id récup dans lee jwt est owneer du bucket ou dans les sharedUsers comme ci dessous
    const images = database.collection(`${userID}/${bucketName}.files`);
    const checkAccessByShare = await images.findOne({ "metadata.sharedUsers": { $elemMatch: { $eq: sharedUserID } } });
    if (!checkAccessByShare) {
      return res.status(403).send({
        message: "You do not own or share access to this file",
      });
    }

    const count = await images.countDocuments();
    if (count === 0) {
      return res.status(500).send({
        message: "No files found!",
      });
    }

    let fileInfos = [];
    const cursor = images.find({});
    await cursor.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + req.params.bucketName + '/' + doc.filename,
        metadata: doc.metadata,
        contentType: doc.contentType,
        uploadDate: doc.uploadDate
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const download = async (req, res) => {
  try {
    await mongoClient.connect();
    const { id: userID } = req.user
    const { bucket: bucketName, filename } = req.params
    if (!bucketName || !filename) {
      return res.status(400).send({
        message: "Invalid query"
      })
    }


    const database = mongoClient.db(_database);
    const bucket = new GridFSBucket(database, {
      bucketName: `${userID}/${bucketName}`,
    });

    let downloadStream = bucket.openDownloadStreamByName(req.params.filename);

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
      console.log(err)
      return res.status(404).send({ message: err });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};



module.exports = {
  uploadFiles,
  getListFiles,
  download,
  updateBucket
};

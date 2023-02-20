const upload = require("../middleware/upload");
const dbConfig = require("../config/db");

const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const baseUrl = "http://localhost:8080/";

const mongoClient = new MongoClient(dbConfig.url);

const uploadFiles = async (req, res) => {
  try {
    const { userID, bucket: bucketName } = req.params
    if (!userID || !bucketName) {
      return res.status(400).json({ error: "Please provide userID and bucketName" });
    }

    await mongoClient.connect();
    const database = mongoClient.db(dbConfig.database);

    // Vérifier si l'utilisateur existe
    const user = await database.collection('users').findOne({ email: bucketName });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur est propriétaire du bucket
    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});
    if (!bucket || bucket.metadata.userID !== userID) {
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
    const { userID, bucket: bucketName } = req.params
    if (!userID || !bucketName) {
      return res.status(400).json({ error: "Please provide userID and bucketName" });
    }

    await mongoClient.connect();
    const database = mongoClient.db(dbConfig.database);

    // Vérifier si l'utilisateur existe
    const user = await database.collection('users').findOne({ email: bucketName });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur est propriétaire du bucket
    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});
    if (!bucket || bucket.metadata.userID !== userID) {
      return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
    }

    // Update the metadata to add the new shared user ID
    const result = await database.collection(`${userID}/${bucketName}.files`).updateMany(
      { "metadata.userID": userID },
      { $push: { "metadata.sharedUsers": "12" } }
    );
    console.log(result)

    if (result.modifiedCount !== 1) {
      return res.status(500).json({ error: 'Failed to update metadata' });
    }
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

    const { userID, bucket: bucketName } = req.params
    if (!userID || !bucketName) {
      return res.status(400).json({ error: "Please provide userID and bucketName" });
    }

    const database = mongoClient.db(dbConfig.database);
    const images = database.collection(`${userID}/${bucketName}.files`);

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
        url: baseUrl + req.params.bucket + '/' + doc.filename,
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

    const { userID, bucket: bucketName, filename } = req.params
    if (!bucketName || !filename || !userID) {
      return res.status(400).send({
        message: "Invalid query"
      })
    }


    const database = mongoClient.db(dbConfig.database);
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

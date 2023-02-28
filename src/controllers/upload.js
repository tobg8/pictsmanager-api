
const { ObjectId } = require('mongodb');
const { MongoClient } = require("mongodb");
const { GridFSBucket } = require("mongodb");

const upload = require("../middleware/upload");
const { url: _url, database: _database } = require("../config/db");
const { authentifyOwnershipOnBucket, checkAccessToBucket } = require('../db/helpers/authentify')

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

const updateBucketPermissions = async (req, res) => {
  try {
    const { id: userID } = req.user
    const { sharedUserID, bucketName } = req.params
    if (!sharedUserID) {
      return res.status(400).json({ error: "Please provide the userID you want to share bucket with" });
    }

    await mongoClient.connect();
    const database = mongoClient.db(_database);

    // Vérifier si l'utilisateur à qui on doit partager existe
    const sharedUser = await database.collection('users').findOne({ _id: new ObjectId(sharedUserID) });
    if (!sharedUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur a un bucket de ce nom
    const bucket = await database.collection(`${userID}/${bucketName}.files`).findOne({});
    if (!bucket) {
      return res.status(404).json({ error: `Le bucket: ${userID}/${bucketName} est introuvable` });
    }

    // Update the metadata to add the new shared user ID
    const result = await database.collection(`${userID}/${bucketName}.files`).updateMany(
      { "metadata.userID": userID },
      { $push: { "metadata.sharedUsers": sharedUserID } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'Failed to update bucket permissions' });
    }
    return res.status(200).json({ message: `user: ${sharedUserID} has access to bucket ${userID}/${bucketName}` })
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
    const { bucketName } = req.body
    if (!bucketName) {
      return res.status(400).json({ error: "Please provide bucketName" });
    }

    const database = mongoClient.db(_database);

    // Vérifier que le userID est soit le détenteur soit un sharedUser du bucket
    const checkBucketAccess = await checkAccessToBucket(bucketName, userID)
    if (checkBucketAccess === false) {
      return res.status(403).json({ error: "L'utilisateur n'a pas les droits sur ce bucket ou ce bucket est vide" });
    }

    const images = database.collection(`${bucketName}.files`);
    const count = await images.countDocuments();
    if (count === 0) {
      return res.status(500).send({
        message: "No files found!",
      });
    }

    let fileInfos = [];
    const cursor = images.find({});

    await cursor.forEach((doc) => {
      console.log(doc)
      fileInfos.push({
        id: doc._id,
        length: doc.length,
        chunkSize: doc.chunkSize,
        name: doc.filename,
        url: baseUrl + 'download' + '/' + bucketName + '/' + doc.filename,
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
    const { id: userID } = req.user
    let { fileName, bucketName, id } = req.params

    if (!bucketName || !fileName) {
      return res.status(400).send({
        message: "Invalid query"
      })
    }

    bucketName = `${id}/${bucketName}`

    await mongoClient.connect();
    const database = mongoClient.db(_database);


    // Vérifier que le userID est soit le détenteur soit un sharedUser du bucket
    const checkBucketAccess = await checkAccessToBucket(bucketName, userID)
    if (checkBucketAccess === false) {
      return res.status(403).json({ error: "L'utilisateur n'a pas les droits sur ce bucket" });
    }

    const bucket = new GridFSBucket(database, {
      bucketName: `${bucketName}`,
    });

    let downloadStream = bucket.openDownloadStreamByName(fileName);

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
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

const updateBucketName = async (req, res) => {
  const { id: userID } = req.user
  const { bucketName } = req.params
  const { newBucketName } = req.body

  if (!userID || !newBucketName || !bucketName) {
    return res.status(400).json({ error: "UserID ou bucketName non renseignés" })
  }

  // Vérifier si l'utilisateur est propriétaire du bucket
  const bucket = await authentifyOwnershipOnBucket(userID, bucketName)
  if (bucket === false) {
    return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
  }

  await mongoClient.connect();
  const database = mongoClient.db(_database);

  // I want to update the bucket userID/bucketName
  try {
    const files = database.collection(`${userID}/${bucketName}.files`)
    const chunks = database.collection(`${userID}/${bucketName}.chunks`)

    await files.rename(`${userID}/${newBucketName}.files`)
    await chunks.rename(`${userID}/${newBucketName}.chunks`)

    return res.status(200).json(`Bucket '${bucketName}' updated succesfully to '${newBucketName}'`)
  } catch (err) {
    console.error(err);
    if (err.code === 26) {
      return res.status(404).json({ error: "Bucket not found", err });
    }
    if (err.code === 20) {
      return res.status(400).json({ error: "New bucket name is the same as previous", err });
    }
    return res.status(500).json({ error: "Failed to update bucket name", err });
  }
}

const deleteBucket = async (req, res) => {
  const { id: userID } = req.user
  const { bucketName } = req.params

  if (!userID || !bucketName) {
    return res.status(400).json({ error: "UserID ou bucketName non renseignés" })
  }

  // Vérifier si l'utilisateur est propriétaire du bucket
  const bucket = await authentifyOwnershipOnBucket(userID, bucketName)
  if (bucket === false) {
    return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
  }

  await mongoClient.connect();
  const database = mongoClient.db(_database);

  try {
    // Drop the files and chunks collections
    await database.collection(`${userID}/${bucketName}.files`).drop();
    await database.collection(`${userID}/${bucketName}.chunks`).drop();

    return res.status(200).json(`Bucket '${bucketName}' deleted`)
  } catch (err) {
    if (err.code === 26) {
      return res.status(404).json({ error: "Bucket not found", err });
    }
    return res.status(500).json({ error: "Failed to update bucket name", err });
  }
}

const deleteFile = async (req, res) => {
  const { id: userID } = req.user
  const { bucketName, fileID } = req.params

  if (!userID || !bucketName || !fileID) {
    return res.status(400).json({ error: "UserID bucketName ou filename non renseignés" })
  }

  // Vérifier si l'utilisateur est propriétaire du bucket
  const bucket = await authentifyOwnershipOnBucket(userID, bucketName)
  if (bucket === false) {
    return res.status(403).json({ error: "L'utilisateur n'est pas propriétaire de ce bucket" });
  }

  await mongoClient.connect();
  const database = mongoClient.db(_database);

  try {
    const file = database.collection(`${userID}/${bucketName}.files`)
    await file.deleteOne({ _id: new ObjectId(fileID) })

    return res.status(200).json(`file '${fileID}' deleted`)
  } catch (err) {
    console.log(err)
  }
}



module.exports = {
  uploadFiles,
  getListFiles,
  download,
  updateBucketPermissions,
  updateBucketName,
  deleteBucket,
  deleteFile
};

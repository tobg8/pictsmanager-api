const util = require("util");
const multer = require("multer");
const dbConfig = require("../config/db");
const MongoClient = require("mongodb").MongoClient;
const { GridFsStorage } = require("multer-gridfs-storage");


var storage = new GridFsStorage({
  url: dbConfig.url + dbConfig.database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];
    if (match.indexOf(file.mimetype) === -1) {
      throw new Error('File type incorrect');
    }

    return {
      bucketName: `${req.params.userID}/${req.params.bucket}`,
      filename: `${file.originalname}`,
      metadata: {
        userID: req.params.userID,
        sharedUsers: [],
      },
    };
  }
});


var uploadFiles = multer({ storage: storage }).array("file", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;

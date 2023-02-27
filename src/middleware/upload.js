const multer = require("multer");
const { promisify } = require("util");
const { GridFsStorage } = require("multer-gridfs-storage");

const { url, database } = require("../config/db");


const storage = new GridFsStorage({
  url: url + database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    try {
      const match = ["image/png", "image/jpeg"];
      if (match.indexOf(file.mimetype) === -1) {
        throw new Error('File type incorrect');
      }

      return {
        bucketName: `${req.user.id}/${req.params.bucketName}`,
        filename: `${file.originalname}`,
        metadata: {
          userID: req.user.id,
          sharedUsers: [],
        },
      };
    } catch (error) {
      console.log('error in storage upload', error)
    }

  }
});


const uploadFiles = multer({ storage: storage }).array("file", 10);
const uploadFilesMiddleware = promisify(uploadFiles);
module.exports = uploadFilesMiddleware;

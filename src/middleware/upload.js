import multer from "multer";
import { promisify } from "util";
import { GridFsStorage } from "multer-gridfs-storage";

import { url as _url, database } from "../config/db";


const storage = new GridFsStorage({
  url: _url + database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];
    if (match.indexOf(file.mimetype) === -1) {
      throw new Error('File type incorrect');
    }

    return {
      bucketName: `${req.params.userID}/${req.params.bucketName}`,
      filename: `${file.originalname}`,
      metadata: {
        userID: req.params.userID,
        sharedUsers: [],
      },
    };
  }
});


const uploadFiles = multer({ storage: storage }).array("file", 10);
const uploadFilesMiddleware = promisify(uploadFiles);
export default uploadFilesMiddleware;

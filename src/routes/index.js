const { Router } = require("express");

const { getHome } = require("../controllers/home");
const { uploadFiles,
  getFolderFiles,
  download,
  updateBucketPermissions,
  updateBucketName,
  deleteBucket,
  deleteFile,
  updateFileName,
  getFolders,
} = require("../controllers/upload");
const { signup, login } = require("../controllers/userController");

const router = Router();
const { verifyToken } = require('../middleware/jwt')

let routes = app => {
  router.get("/", getHome);
  // GET
  // récuperer toutes les photos d'un bucket
  router.get("/get-files", verifyToken, getFolderFiles);
  // récupérer une photo
  router.get("/download/:id/:bucketName/:fileName", verifyToken, download);
  // Récupérer tous les folders que je possède ou qui me sont partagés
  router.get("/get-folders", verifyToken, getFolders);

  // POST
  // upload photos sur le bucket (crée le bucket si il exist pas)
  router.post("/upload/:bucketName", verifyToken, uploadFiles);
  router.post("/sign-up", signup)
  router.post("/login", login)


  // UPDATE
  // update la metadata du bucket (pour partager notre bucket à des utilisateurs)
  router.put("/share/:sharedUserID/:bucketName", verifyToken, updateBucketPermissions);
  // update le nom du bucket
  router.put("/update/:bucketName", verifyToken, updateBucketName)
  // update le nom d'une file
  router.put("/update/:bucketName/:fileID", verifyToken, updateFileName)

  // DELETE
  // delete un bucket
  router.delete("/delete/:bucketName", verifyToken, deleteBucket)
  router.delete("/delete/:bucketName/:fileID", verifyToken, deleteFile)



  return app.use("/", router);
};

module.exports = routes;

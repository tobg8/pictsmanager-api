const { Router } = require("express");

const { getHome } = require("../controllers/home");
const { uploadFiles, getListFiles, download, updateBucketPermissions, updateBucketName } = require("../controllers/upload");
const { signup, login } = require("../controllers/userController");

const router = Router();
const { verifyToken } = require('../middleware/jwt')

//! Toutes les paramètres :userID doivent être enlevé, on aura un middleware jwt pour récup ça.
let routes = app => {
  router.get("/", getHome);

  // upload photos sur le bucket (crée le bucket si il exist pas)
  router.post("/upload/:bucketName", verifyToken, uploadFiles);

  // update la metadata du bucket (pour partager notre bucket à des utilisateurs)
  router.put("/share/:sharedUserID/:bucketName", verifyToken, updateBucketPermissions);

  // update le nom du bucket
  router.put("/update/:bucketName", verifyToken, updateBucketName)

  // récuperer toutes les photos d'un bucket
  router.get("/get-files", verifyToken, getListFiles);

  // récupérer une photo
  router.get("/download/:id/:bucketName/:fileName", verifyToken, download);

  router.post("/sign-up", signup)
  router.post("/login", login)

  return app.use("/", router);
};

module.exports = routes;

const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const userController = require("../controllers/userController")

//! Toutes les paramètres :userID doivent être enlevé, on aura un middleware jwt pour récup ça.
let routes = app => {
  router.get("/", homeController.getHome);

  // upload photos sur le bucket (crée le bucket si il exist pas)
  router.post("/upload/:bucketName/:userID", uploadController.uploadFiles);

  // update la metadata du bucket (pour partager notre bucket à des utilisateurs)
  router.put("/share/:sharedUserID", uploadController.updateBucket);

  // récuperer toutes les photos d'un bucket
  router.get("/get-files/:bucketName/:userID", uploadController.getListFiles);

  // récupérer une photo
  router.get("/:bucket/:userID/:filename", uploadController.download);

  router.post("/sign-up", userController.signup)
  router.post("/login", userController.login)

  return app.use("/", router);
};

module.exports = routes;

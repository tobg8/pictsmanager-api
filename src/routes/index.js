import { Router } from "express";

import { getHome } from "../controllers/home";
import { uploadFiles, updateBucket, getListFiles, download } from "../controllers/upload";
import { signup, login } from "../controllers/userController";

const router = Router();

//! Toutes les paramètres :userID doivent être enlevé, on aura un middleware jwt pour récup ça.
let routes = app => {
  router.get("/", getHome);

  // upload photos sur le bucket (crée le bucket si il exist pas)
  router.post("/upload/:bucketName/:userID", uploadFiles);

  // update la metadata du bucket (pour partager notre bucket à des utilisateurs)
  router.put("/share/:sharedUserID", updateBucket);

  // récuperer toutes les photos d'un bucket
  router.get("/get-files/:bucketName/:userID", getListFiles);

  // récupérer une photo
  router.get("/:bucket/:userID/:filename", download);

  router.post("/sign-up", signup)
  router.post("/login", login)

  return app.use("/", router);
};

export default routes;

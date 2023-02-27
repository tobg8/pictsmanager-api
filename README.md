# Pics manager api, epitech
  - MongoDB
  - Express.Js

# Guideline
- Les imports se font dans un ordre précis (librarie externe, puis import interne) = (importer express avant d'importer le controller)


# Routes

🔒 JWT </br>
⚠️ Les buckets sont crées sous un format spécial, les bucketName sont composés de l'id de l'utilisateur ainsi que le nom du bucket qu'il a envoyé.</br> Exemple = 1212322344/wow

   ### upload files (max 10) to bucket
    - router.post("/upload/:bucketName", verifyToken, uploadFiles) 🔒
      - bucketName = nom du bucket à créer + JWT

  ### update la metadata du bucket (pour partager notre bucket à des utilisateurs)
    - router.put("/share/:sharedUserID/:bucketName", verifyToken, updateBucket) 🔒
      - sharedUserID = l'id du user à partager
      - bucketName = le nom du bucket sans l'id du user (wow)

  ### récuperer toutes les photos d'un bucket
    - router.get("/get-files", verifyToken, getListFiles) 🔒
      - dans body = bucketName = nom entier du bucket avec id (1212322344/wow)

  ### récupérer une photo
    - router.get("/download/:fileName", verifyToken, download) 🔒
      - fileName = le nom de la file à récupérer
      - dans body = bucketName = "bucketName": "63fce0f531fc67cf02a9cb53/super"

  ### signup
    - router.post("/sign-up", signup)
      - dans body = email password

  ### login
    - router.post("/login", login)
       - dans body = email password

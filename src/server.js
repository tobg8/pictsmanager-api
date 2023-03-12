const cors = require("cors");
const express = require("express");
const dotenv = require('dotenv');

const app = express();
const initRoutes = require("./routes");

var corsOptions = {
  origin: "http://localhost:19006"
};

dotenv.config();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
initRoutes(app);

let port = 8080;
app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});

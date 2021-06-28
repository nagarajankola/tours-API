const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("Unhandled exception, shutting down!");
  console.log(err.name, err.message);
    process.exit(1);

});

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("connection succcessfull");
  });
// .catch((err) => console.log("no connection"));

const app = require("./app");

PORT = process.env.PORT || 3000;

const server = app.listen(PORT, (req, res) => {
  console.log("litsening at 3000");
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection. Shutting Down!");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});



const fs = require("fs");
const Tour = require("../../models/tourModel");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

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
  })
  .catch((err) => console.log("no connection"));

// reading file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));

//   importing data into json
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log("Data inserted into db successfully");
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// deleting all data from db
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("data deleted successfully!");
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] == "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}

console.log(process.argv);

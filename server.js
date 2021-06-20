const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('connection succcessfull');
  })
  .catch((err) => console.log('no connection'));

const app = require('./app');




PORT = process.env.PORT || 3000;

app.listen(PORT, (req, res) => {
  console.log('litsening at 3000');
});

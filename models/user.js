const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { uuid } = require('uuidv4');

mongoose
  .connect('mongodb://localhost:27017/auth-demo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connection Established'))
  .catch((err) => console.log(err));

const db = mongoose.connection;
const userSchema = mongoose.Schema({
  uuid: {
    type: String,
  },
  name: {
    type: String,
    index: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
  },
  profileimage: {
    type: String,
  },
  uname: {
    type: String,
  },
  contact: {
    type: Number,
  },
});

const User = (module.exports = mongoose.model('user', userSchema));

module.exports.getUserById = async (id) => {
  return User.findById(id);
};

module.exports.getUserByUuId = async (uuid) => {
  return User.findOne({ uuid });
};

module.exports.getUserByUsername = async (username) => {
  return User.findOne({ uname: username });
};

module.exports.comparePassword = async (candidatepassword, hash) => {
  return bcrypt.compare(candidatepassword, hash);
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};
module.exports.hashPassword = hashPassword;

module.exports.createUser = async (newUser) => {
  const hash = await hashPassword(newUser.password);

  newUser.password = hash;
  newUser.uuid = uuid();
  await newUser.save();
  return newUser;
};

module.exports.getUsers = async () => {
  return User.find();
};

module.exports.deleteById = async (id) => {
  return User.deleteOne({ _id: id });
};

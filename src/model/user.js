const mongoose = require("mongoose");
const { type } = require("os");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: { type: String },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

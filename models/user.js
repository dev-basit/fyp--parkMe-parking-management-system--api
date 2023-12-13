const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 2,
    unique: true,
    maxlength: 50,
  },
  fullName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024,
  },
  phone: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 128,
  },
  address: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  country: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 128,
  },
  city: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 128,
  },
  // isAdmin: Boolean,
  type: {
    type: String,
    required: true,
    enum: ["admin", "employee", "company", "guard"],
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      type: this.type,
      // isAdmin: this.isAdmin,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = {
    username: Joi.string().min(2).max(50).required(),
    fullName: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(4).max(255).required().email(),
    password: Joi.string().min(8).max(255).required(),
    phone: Joi.string().min(4).max(128).required(),
    address: Joi.string().min(5).max(1024).required(),
    country: Joi.string().min(2).max(128).required(),
    city: Joi.string().min(2).max(128).required(),
    type: Joi.string().valid("employee", "company", "guard").required(),
  };

  return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;

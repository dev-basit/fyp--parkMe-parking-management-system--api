const Joi = require("joi");
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Company = mongoose.model("Company", companySchema);

function validateCompany(company) {
  const schema = {
    // this will be used to create User first, and then this userId will be assigned to employee automatically
    username: Joi.string().min(2).max(50).required(),
    fullName: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(4).max(255).required().email(),
    password: Joi.string().min(4).max(255).required(),
    phone: Joi.string().min(4).max(128).required(),
    address: Joi.string().min(5).max(1024).required(),
    country: Joi.string().min(2).max(128).required(),
    city: Joi.string().min(2).max(128).required(),
    type: Joi.string().valid("employee", "company", "guard").required(),
  };

  return Joi.validate(company, schema);
}

exports.Company = Company;
exports.validate = validateCompany;

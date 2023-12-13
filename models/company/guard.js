const Joi = require("joi");
const mongoose = require("mongoose");

const guardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  assignedParkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parking",
  },
  assignedParking: {
    type: String,
    // required: true,
  },
});

const Guard = mongoose.model("Guard", guardSchema);

function validateGuard(guard) {
  const schema = {
    companyId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    // assignedParkingId: Joi.string()
    //   .regex(/^[0-9a-fA-F]{24}$/)
    //   .required(),
    // assignedParking: Joi.string().required(),

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

  return Joi.validate(guard, schema);
}

function validateAssignParkingArea(assignParking) {
  const schema = {
    guardId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    parkingAreaId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    assign: Joi.boolean().required(),
  };

  return Joi.validate(assignParking, schema);
}

exports.Guard = Guard;
exports.validate = validateGuard;
exports.validateAssignParkingArea = validateAssignParkingArea;

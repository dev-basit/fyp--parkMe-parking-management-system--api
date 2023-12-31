const express = require("express");
const router = express.Router();

const { Vehicle, validate } = require("../../models/vehicle/vehicle");

// if we send query string parameters fromc client-side, it will automatically apply it as well
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find(req.query)
      .populate({
        path: "fuelType",
      })
      .populate({
        path: "vehicleType",
      })
      .populate({
        path: "companyId",
        populate: "userId",
      });

    return res.json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found for given id." });

    return res.json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// TODO: create new model and schema for isWorkingFine/maintenance
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const licensePlateNumber = req.body.licensePlateNumber ? req.body.licensePlateNumber : "";
    const chassisNumber = req.body.chassisNumber ? req.body.chassisNumber : "";

    let isVehicleAlreadyExist = await Vehicle.findOne({
      $or: [{ licensePlateNumber: licensePlateNumber }, { chassisNumber: chassisNumber }],
    });

    if (isVehicleAlreadyExist) return res.status(400).send({ message: "Vehcile already exists." });

    const vehicle = new Vehicle(req.body);
    const savedVehicle = await vehicle.save();
    return res.json(savedVehicle);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // TODO: change here as well: req.params.id
    const updatedVehicleType = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedVehicleType) return res.status(404).json({ message: "Vehicle not found for given id." });

    return res.json(updatedVehicleType);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// TODO: when a vehicle is deleted, the respective parking should be deleted, and unassingn the vehicle if assigned to any employee, also remove it from employee record
router.delete("/:id", async (req, res) => {
  try {
    // TODO: change here as well: req.params.id
    const vehicle = await Vehicle.findByIdAndRemove(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found for given id." });

    return res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

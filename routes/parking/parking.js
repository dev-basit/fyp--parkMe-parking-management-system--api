const express = require("express");
const router = express.Router();

const { Parking, validate, validateParkingVehicles } = require("../../models/parking/parking");
const { ParkingArea } = require("../../models/parking/parkingArea");
const { Vehicle } = require("../../models/vehicle/vehicle");
const { Employee } = require("../../models/company/employee");

router.get("/", async (req, res) => {
  try {
    const parkings = await Parking.find(req.query)
      .populate({
        path: "vehicleId",
      })
      .populate({
        path: "parkingAreaId",
        populate: {
          path: "belongsTo",
          populate: {
            path: "userId",
          },
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "assignedVehicleId",
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "userId",
        },
      });

    return res.json(parkings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const parking = await Parking.find({ _id: req.params.id });
    if (!parking) {
      return res.status(404).json({ message: "Parking not found for given id." });
    }

    return res.json(parking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // const vehicle = await Vehicle.findById(req.body.vehicleId);
    // if (!vehicle) return res.status(404).json({ message: "Vehicle not found for given id." });
    // if (vehicle.isParked === true) return res.status(409).json({ message: "Vehicle already parked." });

    const parkingArea = await ParkingArea.findById(req.body.parkingAreaId);
    if (!parkingArea) return res.status(404).json({ message: "Parking area not found for given id." });

    console.log("parking area ", parkingArea);

    let isEmplpoyeeExist = await Employee.findOne({ _id: req.body.employeeId });
    if (!isEmplpoyeeExist)
      return res.status(400).send({ message: "Employee doesnt exist for given id." });

    let companyId = isEmplpoyeeExist.companyId ? isEmplpoyeeExist.companyId : "";

    // TODO: add check for parkingArea belongs to is same as employee belongs to
    // TODO: can employee can have more than one reservation

    const parking = new Parking({ ...req.body, companyId });
    const savedParking = await parking.save(); // Call the save method to trigger the pre hook

    return res.json(savedParking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/find-parkings/", async (req, res) => {
  try {
    const { error } = validateParkingVehicles(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { companyId, startTime, endTime } = req.body;

    const parkings = await Parking.find({
      $or: [
        { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }] },
        { $and: [{ startTime: { $gte: startTime } }, { endTime: { $lt: endTime } }] },
      ],
    });

    // const unique = new Set(parkings.parkingAreaId);
    let availableParkings = {};
    parkings.forEach((item) => {
      let items = availableParkings[item.parkingAreaId] ? availableParkings[item.parkingAreaId] : [];
      items.push(item);
      availableParkings[item.parkingAreaId] = items;
    });

    return res.json(availableParkings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedParking = await Parking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedParking) return res.status(404).json({ message: "Parking not found for given id." });

    return res.json(updatedParking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// TODO: refactor the logic for "save" and "remove" pre middleware logic, middleware logic can also be written here, think about it, should I use fawn?
router.delete("/:id", async (req, res) => {
  try {
    const parking = await Parking.findByIdAndRemove(req.params.id);
    if (!parking) return res.status(404).json({ message: "Parking not found for given id." });
    // else await parking.remove(); // Call the remove method to trigger the pre hook

    return res.json({ message: "Parking deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

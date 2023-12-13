const express = require("express");
const router = express.Router();
const _ = require("lodash");

const { createUser } = require("../users");
const { Guard, validate, validateAssignParkingArea } = require("../../models/company/guard");
const { ParkingArea } = require("../../models/parking/parkingArea");

// if we send query string parameters from client-side, it will automatically apply it as well
router.get("/", async (req, res) => {
  try {
    const guards = await Guard.find(req.query)
      .populate({
        path: "userId",
        populate: {
          path: "userId",
          select: "-password",
        },
      })
      .populate({
        path: "companyId",
        populate: {
          path: "userId",
          select: "-password",
        },
      });
    // .populate({
    //   path: "assignedParkingId",
    // });

    return res.json(guards);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const guard = await Guard.find({ _id: req.params.id })
      .populate({
        path: "userId",
        populate: {
          path: "userId",
          select: "-password",
        },
      })
      .populate({
        path: "companyId",
        populate: {
          path: "userId",
          select: "-password",
        },
      });
    // .populate({
    //   path: "assignedParkingId",
    // });

    if (!guard) {
      return res.status(404).json({ message: "Guard not found for given id." });
    }

    return res.json(guard);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // if assignedParkingId is present in req.body and parking-area is not already assigned, then assign otherwise don't assign it when creating guard.
    // if (req.body.assignedParkingId) {
    //   const parkingArea = await ParkingArea.findById(req.body.assignedParkingId);
    //   if (!parkingArea) return res.status(404).json({ message: "Parking area not found for given id." });
    //   if (parkingArea.isAssigned === true)
    //     return res.status(409).json({ message: "Parking already assigned to Guard." });

    //   parkingArea.isAssigned = true;
    //   await parkingArea.save();
    // }

    // this will create User first, and then user._id will be added to employee document
    let user = await createUser(req, res);

    const guard = new Guard({ ...req.body, userId: user._id });
    const savedGuard = await guard.save();

    const token = user.generateAuthToken();
    let data = {
      ..._.pick(user, ["", "username", "fullName", "email", "type"]),
      ..._.pick(savedGuard, ["_id", "companyId", "assignedParkingId", "userId"]),
    };

    return res.header("x-auth-token", token).json({ data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedGuard = await Guard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedGuard) return res.status(404).json({ message: "Guard not found for given id." });

    return res.json(updatedGuard);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/assign-parking-area", async (req, res) => {
  try {
    // const { employeeId } = req.params;
    const { guardId, parkingAreaId, assign } = req.body;

    const { error } = validateAssignParkingArea({ guardId, parkingAreaId, assign });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const guard = await Guard.findById(guardId);
    if (!guard) return res.status(404).json({ message: "Guard not found for given id." });

    const parkingArea = await ParkingArea.findById(parkingAreaId);
    if (!parkingArea) return res.status(404).json({ message: "Parking area not found for given id" });

    if (assign == "true") {
      // TODO
      // if (parkingArea.isAssigned === true)
      //   return res.status(409).json({ message: "Parking already assigned." });

      guard.assignedParkingId = parkingAreaId;
      guard.assignedParking = "true";
      await guard.save();

      // TODO
      // parkingArea.isAssigned = assign;
      // await parkingArea.save();

      return res.status(200).json({ message: "Successfully assigned parking area to guard" });
    } else if (assign == "false") {
      // TODO
      // if (parkingArea.isAssigned === false)
      //   return res.status(409).json({ message: "Parking is not assigned already." });

      guard.assignedParkingId = null;
      guard.assignedParking = "false";
      await guard.save();

      // TODO
      // parkingArea.isAssigned = false;
      // await parkingArea.save();

      return res.status(200).json({ message: "Successfully un-assigned parking area to guard" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// TODO: when an employee is deleted the respective base user should be deleted, and if vehicle is assigned that vehicle should be unassigned
router.delete("/:id", async (req, res) => {
  try {
    // corrrect comments
    // before deleting set the isAssigned property of vehicle to false if vehicle is assigned to employee that is being deleted
    const guard = await Guard.findByIdAndRemove(req.params.id);
    if (!guard) return res.status(404).json({ message: "Guard not found for given id." });

    if (guard.assignedParkingId) {
      const parkingArea = await ParkingArea.findById(guard.assignedParkingId);
      if (!parkingArea)
        return res.status(404).json({ message: "Parking not found for parking id assigned to guard." });

      if (parkingArea.isAssigned === true) {
        parkingArea.isAssigned = false;
        await parkingArea.save();
      }
    }

    return res.json({ message: "Guard deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

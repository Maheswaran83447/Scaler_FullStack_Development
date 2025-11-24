const express = require("express");
const router = express.Router();
const UserAddressHandler = require("../handlers/UserAddressHandler");

router.get("/:userId", UserAddressHandler.listUserAddresses);
router.post("/", UserAddressHandler.createUserAddress);
router.delete("/:addressId", UserAddressHandler.deleteUserAddress);

module.exports = router;

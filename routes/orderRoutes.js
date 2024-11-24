const express = require("express");
const {
  placeOrder,
  updateOrder,
  cancelOrder,
  getUserOrders,
  getOrders,
  changeOrderStatus,
  getUserOrderById,
  sendEmail,
} = require("../controller/orderController");
const { authenticateToken, isAdmin } = require("../Middleware/auth");
const router = express.Router();

router.post("/placeOrder", placeOrder);
router.put("/updateOrder/:id", authenticateToken, updateOrder);
router.delete("/cancelOrder/:id", authenticateToken, cancelOrder);
router.get("/getUserOrder", authenticateToken, getUserOrders);
router.get("/getOrders", authenticateToken, getOrders);
router.put("/orderStatus", authenticateToken, isAdmin, changeOrderStatus);
router.get("/getUserOrderById", authenticateToken, getUserOrderById);
router.post("/sendEmail",authenticateToken, isAdmin, sendEmail)

module.exports = router;

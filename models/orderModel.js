const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = mongoose.Schema(
  {
    products: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Products" },
        quantity: { type: Number, default: 1 },
        option: {
          type: String,
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
    customer: {
      type: Schema.Types.ObjectId,
      ref: "perfume_users",
    },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    orderStatus: { type: String, default: "pending" },
    shippingAddress: {
      city: { type: String, required: true },
      address: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("perfume_orders", orderSchema);

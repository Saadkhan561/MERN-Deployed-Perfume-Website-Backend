const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "perfume_categories",
    },
    brand: { type: String, required: true },
    imagePaths: [{ type: String }],
    options: {
      type: Map,
      of: {
        price: { type: Number },
        quantityAvailable: { type: Number },
        discount: { type: Number, default: 0 },
      },
    },
    pinned: { type: Boolean, default: false },
    productStatus: { type: Boolean, default: true },
  },
  { timestamp: true }
);

module.exports = mongoose.model("perfume_products", productSchema);

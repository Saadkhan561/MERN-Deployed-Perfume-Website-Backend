const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
    }
  },
  { timestamp: true }
);

module.exports = mongoose.model("perfume_categories", categorySchema);

const mongoose = require("mongoose");

const parentCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model(
  "perfume_parent_categories",
  parentCategorySchema
);

const ParentCategory = require("../models/parentCategoryModel");

const addParentCategory = async (req, res) => {
  try {
    await ParentCategory.create({ name: req.body.name });
    return res.status(200).json({ message: "Parent category created" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

const fetchAllParentCategories = async (req, res) => {
  try {
    const parentCategories = await ParentCategory.aggregate([
      {
        $lookup: {
          from: "perfume_categories",
          localField: "_id",
          foreignField: "parentCategory",
          as: "subCategories",
        },
      },
    ]);
    return res.status(200).json(parentCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addParentCategory,
  fetchAllParentCategories
};

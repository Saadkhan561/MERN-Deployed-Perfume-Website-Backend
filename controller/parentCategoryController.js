const ParentCategory = require("../models/parentCategoryModel");

const addParentCategory = async (req, res) => {
  try {
    await ParentCategory.create({ name: req.body.name });
    return res.status(200).json({ message: "Parent category created" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

const fetchParentCategories = async (req, res) => {
  try {
    const parentCategories = await ParentCategory.find({});
    return res.status(200).json(parentCategories);
  } catch (error) {
    return res.status(500).json(error);
  }
};

module.exports = {
  addParentCategory,
  fetchParentCategories,
};

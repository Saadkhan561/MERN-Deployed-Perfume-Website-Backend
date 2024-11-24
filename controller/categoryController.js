const Category = require("../models/categoryModel");

const addCategory = async (req, res) => {
  try {
    await Category.create(req.body);
    return res.json({ message: "Category Created" });
  } catch (err) {
    return res.json(err);
  }
};

const updateCategory = async (req, res) => {
  const { id, name } = req.body;
  try {
    await Category.updateOne({ _id: id }, { name: name });
    return res.json({message: "Updated"});
  } catch (err) {
    return res.json(err);
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.deleteOne({ _id: req.params.id });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.json(err);
  }
};

const fetchAllCategories = async (req, res) => {
  const categories = await Category.find({});
  try {
    if (categories === null) {
      return res.status(404).json("No categories found!");
    }
    return res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const fetchCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.query.categoryId });
    return res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  fetchAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryById,
};

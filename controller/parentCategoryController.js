const ParentCategory = require("../models/parentCategoryModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

const path = require("path");
const fs = require("fs");
const req = require("express/lib/request");

const addParentCategory = async (req, res) => {
  console.log("in service", req.body);
  try {
    await ParentCategory.create({ name: req.body.name });
    const backendPath = path.join(__dirname, "..");
    const categoryImageDir = path.join(
      backendPath,
      "categoryImages",
      req.body.name
    );
    if (!fs.existsSync(categoryImageDir)) {
      fs.mkdirSync(categoryImageDir, { recursive: true });
    }
    return res.status(200).json({ message: "Parent category created" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

const updateParentCategory = async (req, res) => {
  const { id, name, parentCategory } = req.body;
  try {
    await ParentCategory.updateOne({ _id: id }, { name: name });
    const backendPath = path.join(__dirname, "..");
    const categoryImageDir = path.join(backendPath, "categoryImages");
    const sourcePath = path.join(categoryImageDir, parentCategory);
    const destinationPath = path.join(categoryImageDir, name);
    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, destinationPath);
    } else {
      return res
        .status(404)
        .json({ message: "Source directory does not exist" });
    }
    return res.json({ message: "Updated" });
  } catch (err) {
    return res.json(err);
  }
};

const deleteParentCategory = async (req, res) => {
  try {
    const categoriesToDelete = await Category.find({
      parentCategory: req.params.id,
    });
    const categoryIds = categoriesToDelete.map((category) => category._id);
    await Product.deleteMany({ category: { $in: categoryIds } });
    await Category.deleteMany({ parentCategory: req.params.id });
    await ParentCategory.deleteOne({ _id: req.params.id });
    const backendPath = path.join(__dirname, "..");
    const categoryImageDir = path.join(
      backendPath,
      "categoryImages",
      req.body.parentCategory
    );
    if (fs.existsSync(categoryImageDir)) {
      fs.rmSync(categoryImageDir, { recursive: true, force: true });
    }
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.json(err);
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
  fetchAllParentCategories,
  updateParentCategory,
  deleteParentCategory,
};

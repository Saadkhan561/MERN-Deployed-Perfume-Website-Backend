const Category = require("../models/categoryModel");
const ParentCategory = require("../models/parentCategoryModel");
const { ObjectId } = require("mongodb");

const path = require("path");
const fs = require("fs");

const addCategory = async (req, res) => {
  const { category, parentId } = req.body;
  const id = ObjectId.createFromHexString(parentId);
  try {
    await Category.create({ name: category, parentCategory: id });
    return res.json({ message: "Category Created" });
  } catch (err) {
    return res.json(err);
  }
};

const updateCategory = async (req, res) => {
  const { id, name } = req.body;
  try {
    await Category.updateOne({ _id: id }, { name: name });
    return res.json({ message: "Updated" });
  } catch (err) {
    return res.json(err);
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.deleteOne({ _id: req.params.id });
    const backendPath = path.join(__dirname, "..");
    const categoryImageDir = path.join(
      backendPath,
      "categoryImages",
      req.body.parentCategory,
      req.body.category
    );
    if (fs.existsSync(categoryImageDir)) {
      fs.rmSync(categoryImageDir, { recursive: true, force: true });
      console.log("Category images removed");
    }
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.json(err);
  }
};

const fetchAllCategories = async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "perfume_parent_categories",
        localField: "parentCategory",
        foreignField: "_id",
        as: "parentCategoryDetails",
      },
    },
    {
      $unwind: "$parentCategoryDetails",
    },
    {
      $project: {
        _id: 1,
        name: 1,
        parentCategoryName: "$parentCategoryDetails.name",
      },
    },
  ]);
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

const fetchCategoryImages = async (req, res) => {
  const backendPath = path.join(__dirname, "..");
  const { category, parentCategory } = req.params;
  const categoryImageDir = path.join(
    backendPath,
    "categoryImages",
    parentCategory,
    category
  );
  if (fs.existsSync(categoryImageDir)) {
    fs.readdir(categoryImageDir, (err, files) => {
      if (err) {
        console.error("Directory read error:", err);
        return res
          .status(500)
          .json({ message: "Unable to read the directory" });
      }

      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );

      if (imageFiles.length === 0) {
        return res
          .status(404)
          .json({ message: "No images found for this category" });
      }

      try {
        const imagePaths = imageFiles.map((file) =>
          path.join(categoryImageDir, file)
        );
        const images = imagePaths.map((imagePath) =>
          fs.readFileSync(imagePath).toString("base64")
        );
        res.json(images);
      } catch (fileErr) {
        console.error("File read error:", fileErr);
        res.status(500).json({ message: "Error reading image files" });
      }
    });
  } else {
    console.error("Category folder not found:", categoryImageDir);
    res.status(404).json({ message: "Category folder not found" });
  }
};

module.exports = {
  fetchAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryById,
  fetchCategoryImages,
};

const ParentCategory = require("../models/parentCategoryModel");

const path = require("path");
const fs = require("fs");

const addParentCategory = async (req, res) => {
  try {
    await ParentCategory.create({ name: req.body.name });
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
      console.log("Directory renamed successfully");
    } else {
      console.log("Source directory does not exist");
      return res
        .status(404)
        .json({ message: "Source directory does not exist" });
    }
    return res.json({ message: "Updated" });
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
};

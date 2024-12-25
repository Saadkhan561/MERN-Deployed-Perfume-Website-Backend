const express = require("express");
const {
  addCategory,
  updateCategory,
  deleteCategory,
  fetchAllCategories,
  fetchCategoryById,
  fetchCategoryImages,
  fetchCategoriesByParentId,
} = require("../controller/categoryController");
const { authenticateToken, isAdmin } = require("../Middleware/auth");
const router = express.Router();

const path = require("path");
const multer = require("multer");
const fs = require("fs");

// CODE FOR MULTER STORAGE FOR STORING CATEGORY IMAGE FILES
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const { category, parentCategory } = req.body;
      const uploadDir = path.join(
        __dirname,
        "../categoryImages",
        parentCategory,
        category
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.log(error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadCategoryImages = multer({ storage: categoryStorage });

router.get("/getCategories", fetchAllCategories);
router.get("/getCategoryById", fetchCategoryById);
router.get("/getCategoriesByParentId/:id", fetchCategoriesByParentId);
router.post(
  "/addCategory",
  authenticateToken,
  uploadCategoryImages.single("images"),
  addCategory
);
router.put("/updateCategory", authenticateToken, isAdmin, updateCategory);
router.post("/deleteCategory/:id", authenticateToken, isAdmin, deleteCategory);
router.get(
  "/categoryImages/:parentCategory/:category",
  fetchCategoryImages
);

module.exports = router;

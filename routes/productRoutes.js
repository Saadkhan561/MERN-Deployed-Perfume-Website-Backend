const Category = require("../models/categoryModel");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const {
  getAllProducts,
  getProductById,
  postProduct,
  updateProduct,
  searchResults,
  trendingProducts,
  getProductsByCategory,
  getProductImages,
  getProducts,
  editProduct,
} = require("../controller/productController");
const { authenticateToken, isAdmin } = require("../Middleware/auth");
const path = require("path");
const router = express.Router();
const upload = multer();

// CODE FOR MULTER STORAGE FOR STORING IMAGE FILES
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const category = await Category.findOne({ name: req.body.category });
      if (!category) {
        const { category } = req.body;
        console.log("Creating new category");
        // return cb(new Error("Category not found"), null);
        const newCategory = await Category.create({
          name: category,
        });
        const uploadDir = path.join(
          __dirname,
          "../images",
          category,
          req.body.name
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } else {
        const uploadDir = path.join(
          __dirname,
          "../images",
          category.name,
          req.body.name
        );

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadImages = multer({ storage: storage });

router.get("/getProductsByCategory/:id", getProductsByCategory);
router.get("/getProducts", getAllProducts);
// FOR FETCHING NON FILTERED PRODUCTS
router.get("/getAllProducts", authenticateToken, getProducts);
router.get("/trendingProducts", trendingProducts);
router.get("/images/:category/:productName", getProductImages);
router.get("/getProductById/:id", getProductById);
router.get("/search", searchResults);

router.put("/updateProduct/:id", authenticateToken, isAdmin, updateProduct);
router.put("/editProduct", authenticateToken, isAdmin, editProduct);

router.post("/addProduct", uploadImages.array("images", 3), postProduct);
//router.post('/addProduct', authenticateToken, isAdmin, postProduct)

module.exports = router;

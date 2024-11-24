const express = require('express')
const {addCategory,updateCategory,deleteCategory, fetchAllCategories, fetchCategoryById } = require('../controller/categoryController')
const { authenticateToken, isAdmin } = require('../Middleware/auth')
const router = express.Router()

router.get('/getCategories', fetchAllCategories)
router.get('/getCategoryById', fetchCategoryById)
router.post('/addCategory', authenticateToken,isAdmin, addCategory)
router.put('/updateCategory', authenticateToken, isAdmin, updateCategory);
router.post('/deleteCategory/:id',authenticateToken, isAdmin,deleteCategory)

module.exports = router
const express = require('express') 
const { authenticateToken, isAdmin } = require('../Middleware/auth')
const { addParentCategory, fetchAllParentCategories, updateParentCategory } = require('../controller/parentCategoryController')
const router = express.Router()

router.post('/addParentCategory', authenticateToken, isAdmin, addParentCategory)
router.get('/fetchAllParentCategories', authenticateToken, fetchAllParentCategories)
router.put('/updateParentCategory', authenticateToken, isAdmin, updateParentCategory)

module.exports  = router
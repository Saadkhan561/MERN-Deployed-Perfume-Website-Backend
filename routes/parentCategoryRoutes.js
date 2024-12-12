const express = require('express') 
const { authenticateToken, isAdmin } = require('../Middleware/auth')
const { addParentCategory, fetchAllParentCategories } = require('../controller/parentCategoryController')
const router = express.Router()

router.post('/addParentCategory', authenticateToken, isAdmin, addParentCategory)
router.get('/fetchAllParentCategories', authenticateToken, fetchAllParentCategories)

module.exports  = router
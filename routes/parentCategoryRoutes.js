const express = require('express') 
const { authenticateToken, isAdmin } = require('../Middleware/auth')
const { addParentCategory, fetchParentCategories } = require('../controller/parentCategoryController')
const router = express.Router()

router.post('/addParentCategory', authenticateToken, isAdmin, addParentCategory)
router.get('/fetchParentCategories', authenticateToken, fetchParentCategories)

module.exports  = router
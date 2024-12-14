const express = require('express') 
const { authenticateToken, isAdmin } = require('../Middleware/auth')
const { addParentCategory, fetchAllParentCategories, updateParentCategory, deleteParentCategory } = require('../controller/parentCategoryController')
const router = express.Router()

router.post('/addParentCategory', authenticateToken, isAdmin, addParentCategory)
router.get('/fetchAllParentCategories', authenticateToken, fetchAllParentCategories)
router.put('/updateParentCategory', authenticateToken, isAdmin, updateParentCategory)
router.post('/deleteParentCategory/:id', authenticateToken, isAdmin, deleteParentCategory)

module.exports  = router
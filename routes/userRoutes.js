const express = require('express')
const { createUser, loginUser, resetPassword, addAddress } = require('../controller/userController')
const { authenticateToken } = require('../Middleware/auth')
const router = express.Router()
// FUNCTION TO AUTHORIZE USER 


router.post('/createUser',createUser)
router.post('/loginUser', loginUser)
router.post('/resetPassword', resetPassword)
router.put('/addAddress', authenticateToken, addAddress)

module.exports = router
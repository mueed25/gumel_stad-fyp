const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const requireAuth = require('../middlewares/authMiddleware')


router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.get('/register', (req,res) => {
    res.render('register')
})
router.get('/login', (req,res) => {
    res.render('login')
})
router.get( '/dashboard', requireAuth , (req,res) => {
    res.render('dashboard', { user: req.user })
})

module.exports = router
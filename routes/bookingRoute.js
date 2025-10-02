const express = require('express')
const router = express.Router()
const requireAuth = require('../middlewares/authMiddleware')
const { route } = require('./authRoutes')

router.get('/profile', requireAuth, (req, res) => {
    res.send('Hi welcome to your profile')
})
router.get('/events', (req, res) => {
    res.render('events')
})
router.get('/about', (req, res) => {
    res.render('about')
})

module.exports = router
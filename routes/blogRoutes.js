const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')

router.post('/blog', blogController.blog)
router.get('/blog/:slug', blogController.blogDetails)
router.get('/blog', (req, res) => {
    res.render('blog')
})

module.exports = router
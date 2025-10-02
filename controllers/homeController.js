const Users = require('../models/users')


exports.home = async (req, res) => {

const user = await Users.findOne({ _id: req.session.userId })
res.render('home', { 
    session: req.session.id,
    user: user ? user.email : null
})

}
const Users = require('../models/users')


exports.home = async (req, res) => {

const user = await Users.findOne({ _id: req.session.userId })
console.log(req.session)
res.render('home', {
})

}


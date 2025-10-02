const bcrypt = require('bcryptjs')
const Users = require('../models/users')

exports.register = async (req, res) => {
  const user = await Users.findOne({ _id: req.session.userId })
    try {
       const { name, email, password} = req.body 
       const UserExist = await Users.findOne({ email: email})
       if (UserExist) {
      return res.status(400).json({ message: "User already exists" });
    }

       const hashedPassword = await bcrypt.hash(password, 10)
       const user = new Users({ name, email, password: hashedPassword})
       await user.save()
       console.log('password', hashedPassword)

       console.log('email', email)


       req.session.userId = user._id
       console.log('Session ID:', req.session.id);
       return res.status(201).json({
        message: "User registered sucessfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            user: user ? user.email : null,
        }
       })
       
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
}

exports.login = async (req, res) => {
  const user = await Users.findOne({ _id: req.session.userId })
  try {
    const { email, password } = req.body;

    console.log('email ' + email);
    console.log('password ' + password);

    const user = await Users.findOne({ email: email });
    if (!user) {
        return res.status(400).json({ message: ['Invalid email or password'] });
    }
    

    req.session.userId = user.id
    return res.json({ message: 'logged in sucessfull', redirect: '/', success: true})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};



exports.logout = async (req, res) => {
   req.session.destroy((err) => {
    if (err) return res.status(500).send('Could not logout ')
    res.redirect('/auth/register')
    })
}
const express = require('express');
const bodyParser = require('body-parser');
const connectToDb = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoute')
const homeRoutes = require('./routes/homeRoutes')
const { engine } = require('express-handlebars');
const path = require('path');
const Users = require('./models/users');
const port = 3011
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');

const app = express();

app.engine('hbs', engine({
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    formatDate: (date) => new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }),
    eq: (a, b) => a === b,
    json: (context) => JSON.stringify(context),
  },
}));

app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json())


app.use(session({
    secret: 'final year project for stadium in gumel',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/final_year_project',
        collectionName: 'session'
    }),
    cookie: { secure:false, maxAge: 3600000}
}))

app.use( async (req, res, next) => {
    if (req.session.userId) {
        const user = await Users.findOne({ _id: req.session.userId })
        console.log('Middleware User:', user);
        res.locals.user = user ? { email: user.email, name: user.name } : null;

    } else {
        res.locals.user = null;
    }
    next()
}

)

connectToDb();


app.use('/auth', authRoutes)
app.use('/', bookingRoutes)
app.get('/', homeRoutes)
// app.get('/', (req, res) => {
//     console.log(req.session)
//     res.render('home', { session: req.session.id })
// })


app.listen( port, () => {
    console.log(`Server is runnig at port ${port}`)
})

// (req,res) => {
//     if (req.session.views) {
//         req.session.views++
//     } else {
//         req.session.views =1 
//     }
//     console.log(req.session)
//     console.log(req.session.id)
//     res.render('home',{session: req.session.id})

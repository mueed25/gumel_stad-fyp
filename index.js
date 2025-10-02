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
const port = 3011

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
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

connectToDb();


app.use('/auth', authRoutes)
app.use('/', bookingRoutes)
app.get('/', homeRoutes)


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

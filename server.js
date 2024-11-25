const express = require('express')
const app = express()
const path = require('path')
const cors = require("cors");
const userRouter = require('./Router/userRouter/user');
const adminRouter = require('./Router/adminRouter/admin')
const flash = require('connect-flash');
const nocache = require('nocache')
const swal = require('sweetalert2')
const passport = require('./config/passport')
const multer = require('multer')
const methodOverride = require('method-override');
const hbs = require('hbs');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const session = require('express-session');
const mongoose = require('mongoose')
require('dotenv').config()
const cron=require('node-cron')
const{restorePricesAfterOfferExpiration}= require('./controller/adminController/offerController')


app.use(nocache())
app.use('/uploads', express.static('uploads'));

app.use(express.json())




const mongoConnect = process.env.MONGO_URI
// middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cors());
// app.use(session({
//     secret: 'your_secret_key',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 3600000 }
// }));

app.use(session({
    secret: 'your_secret_key',  
    resave: false,            
    saveUninitialized: false, 
    cookie: {
        maxAge: 3600000,   
        httpOnly: true,      
        sameSite: 'lax',     
        secure: false        
    }
}));


app.use(flash())

app.use((req, res, next) => {
    res.locals.category_err = req.flash('category_err');
    res.locals.success_msg = req.flash('success_msg');
    next();
});



app.use(passport.initialize())
app.use(passport.session())

hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('gt', (a, b) => a > b);
hbs.registerHelper('lt', (a, b) => a < b);
hbs.registerHelper('add', (a, b) => a + b);
hbs.registerHelper('subtract', (a, b) => a - b);
hbs.registerHelper('range', (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i));
hbs.registerHelper('or', function (a, b) {
    return a || b;
});
hbs.registerHelper('formatDate', function (date) {
    return new Date(date).toLocaleDateString('en-US');  
});


cron.schedule('0 0 * * *', () => {
    console.log('Checking for expired offers and restoring prices...');
    restorePricesAfterOfferExpiration();  // Call your function
});

// Set up 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


try {
    mongoose.connect(mongoConnect, {
    })
    console.log('mongodb connected successfully');


} catch (err) {
    console.log(err);

}


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/user/register' }), (req, res) => {
    res.redirect('/user/home')
})


app.use('/user', userRouter)
app.use('/admin', adminRouter)


app.use((req, res, next) => {
    res.status(404);
    res.render('error', { message: "Page Not Found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500);
    res.render('error', { message: "Internal Server Error" });
});

app.listen(5000, () => {
    console.log('server runned sucessfullly ');

})
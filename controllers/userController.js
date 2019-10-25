const mongoose = require('mongoose');
const User = mongoose.model('User'); // can do this as its been included in start.js
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login'});
};

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register'});
};

// Take in next here as wan to use this as middleware.
// Using expressValidator from app.js
exports.validateRegister = (req, res, next) => {
    // from expressValidator from app.js
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'The email is not valid!').isEmail();
    // handle differences in emails e.g. caps,
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddres: false, // uk vs us differences
    });
    // Have to do server-side check as someone could open Dev Tools and
    // remove the 'required' attribute from the HTML
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

    // this runs all the checks we have created above
    const errors = req.validationErrors();

    if(errors){
        // want to handle error here instead of passing to middleware
        req.flash('error', errors.map(err => err.msg));
        // dont clear the form - allow users to make adjustments
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash()});
        return; // stop the function from running
    }
    next(); // there were no errors
};

// Pass next because we want to use this as middleware,
// end of this route processing is actually logging the user in
exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name});

    // passportLocalMongoose has given us access to this method on our model
    // it automatically creates a hash of our passsword which is saved in the db

    // This external library isn't promise-based, instead uses callbacks.
    // We use Promisify library to make into more modern-based promise approach for us

    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    // res.send('it works!');
    next();
};

exports.account = async (req, res) => {
    res.render('account', { title: 'Edit your account'});
};

exports.updateAccount = async(req, res) => {
    // Take data user has sent update
    // certain variables
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    // Find specific user and update properties in the database
    const user = await User.findOneAndUpdate(
        { _id: req.user._id}, // query. Take this from req as do not want user to supply --> could be maliciously misused
        { $set: updates} , // updates
        { new: true, runValidators: true, context: 'query' } // options
    );

    // res.json(user);

    // sends the user back to the page they were just on
    req.flash('success', 'Updated the profile');
    res.redirect('back');

};
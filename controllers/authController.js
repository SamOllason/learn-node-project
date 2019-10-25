const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

// A strategy with passport is way of sending passport data (username + password) with passport to check if the user
// to someone to check if a user is logged in or not.
// A strategy is something that will interface with some kind of service and check that you are allowed to access
// E.g. could have a strategy for Facebook which is an interface to check if user has right tokens to be logged in with Fb

// We will use local strategy here. Check if username and password is been sent correctly

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/');
};

// middleware to check user is logged in
exports.isLoggedIn = (req, res, next) => {
    // first check if the user is authenticated
    // using another method that passportjs provides us
    if(req.isAuthenticated()){
        next(); // carry on as user is logged in!
        return;
    }
    req.flash('error', 'you must be logged in!');
    res.redirect('/login');

};

exports.forgotPassword = async (req, res) => {
    // 1. See if user with email exists
    const user = await User.findOne({email: req.body.email});
    if(!user){
        // WARNING!: may not want to let hackers know this:
        // don't want hackers to know someone has an account on this site and also don't want to let them
        // know which email addresses have accounts
        // So could say a message like "password reset has been mailed to you".
        req.flash('error', 'No account with that email address');
        return res.redirect();
    }
    // 2. Set reset tokens and expiry on their account
    // use cryptographically secure random strings
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    await user.save();

    // 3. Send them an email with the token
    // In real world we wouldn't do this! See future video where we send email with nodeJS

    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    req.flash('success', 'You have emailed a password reset link ' + resetURL);

    // 4. Redirect them to login page
    res.redirect('/login');
};

exports.resetPassword = async (req, res) => {
    // check token and see if there is someone with the token
    // and then check if token has expired
    const user = await User.findOne({
        resetPasswordToken: req.params.token, // someone has to know the token
        // query object checks if date is greater than right now
        // if has been more than an hour then token will have expired, and
        // the query below would show us that the date is less than 'now'
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user){
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }
    //if there is a user then show the reset password form
    res.render('reset', { title: 'Reset Your Password'});
};

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body['password-confirm']) {
        next(); // keep it going
        return;
    }

    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
};

exports.updatePassword = async (req, res, next) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        // query object checks if date is greater than right now
        // if has been more than an hour then token will have expired, and
        // the query below would show us that the date is less than 'now'
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user) {
        req.flash('error', 'Password request is invalid or has expired');
        return res.redirect('/login');
    }

    // Create new method where we can await setPassword
    const setPassword = promisify(user.setPassword());
    await setPassword(req.body.password);

    // These will get set to default
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Now update the database
    const updatedUser = await user.save();

    // Automatically log the user in from here.
    // Can use this method from the PassportJS middleware we introduced and set up
    await req.login(updatedUser);
    req.flash('success', 'Nice! Your password has been reset! You are now logged in!');

};

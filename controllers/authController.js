const passport = require('passport');

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

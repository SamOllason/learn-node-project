const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// handler for configuring passport
passport.use(User.createStrategy());

// tell passport what to do with actual user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


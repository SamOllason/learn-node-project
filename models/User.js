const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Shouldn't have to do this as have done it in start.js
// but suppresses warning messages about deprecation which are false positives
mongoose.Promose = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        // Data normalisation:
        unique: true, // make sure that there is one account per email address
        lowercase: true, // always save as a lowercase, we will use middleware to save them in this form
        trim: true,

        // There will be client-side checks, but good practice to have this here
        // in case someone maliciously turns the checks off or someone in old browser
        validate: [ validator.isEmail, 'Invalid Email Address' ],

        // In case someone manages to bypass client-side validation (see above)
        required: 'Please supply an email address',
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    hearts: [
        // an array of ids for stores
        { type: mongoose.Schema.ObjectId, ref: 'Store'}
    ]



    // Want to store a hash of their password in database,
    // do this with PassportJS elsewhere in a handler.

});

// virtual methods are for calculating things on the fly.
// this image isn't stored in the database but is virtual
userSchema.virtual('gravatar').get(function(){
    // takes use email address and hash it so that we don't leak in the image source
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

// Takes care of adding additional authentication fields to schema
// and additional methods for working with this
userSchema.plugin(passportLocalMongoose, { usernameField: 'email'});

// Validation has good error checking, but errors aren't user-friendly.
// This plugin helps us with this.
userSchema.plugin(mongodbErrorHandler);

// Use module.exports here as this is the main thing that will be exported from the file
module.exports = mongoose.model('User', userSchema);

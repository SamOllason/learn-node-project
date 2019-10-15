const mongoose = require('mongoose');

// There are multiple ways to handle promises when querying data
// We use the global promise here so we can use the built-in ES6 Promise
// so we can use async/await
mongoose.Promise = global.Promise;

// To make URL-friendly names for slugs
const slug = require('slugs');

// Do data normalisation as close to model as possible
// instead of just before saving
const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, // automatically trim
        required: 'Please enter a store name!' // mongo complains when we dont set a store with a name anyway, so use this here for more control
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    }
});

// Want to auto-generate the slug and hav this saved into our model
storeSchema.pre('save', function(next){
    // Use a standard function here as want 'this' to be dynamically scoped
    // to be the model that in question

    if(!this.isModified('name')) {
        next(); // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);

    // Now pre-save has done, can move to next step
    next();

    // TODO: make more resilient so slugs are unique...
});


// If the main thing in a file is going to be exporting
// put it on module name.
// A question of whether importing a function or an object with loads
// of properties on it.
module.exports = mongoose.model('Store', storeSchema);
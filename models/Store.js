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
    },
    photo: String, // name of photo stored on disc on server
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    // make sure to persist virtual fields whenever we use a snapshot of a
    // store variable in code
    toJSON: { virtuals: true },
    toObject: { virtuals: true}
    }
);

// Define out indexes.
// This is a compound index.
storeSchema.index({
    name: 'text', // means we can do things like case sensitivity etc.
    description: 'text'
});

storeSchema.index({ location: '2dsphere'});

// Want to auto-generate the slug and hav this saved into our model
storeSchema.pre('save', async function(next){
    // Use a standard function here as want 'this' to be dynamically scoped
    // to be the model that in question

    if(!this.isModified('name')) {
        next(); // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);

    // Find stores with the same name: name, name-1, name-2, ...
    // Use a Regex to do fuzzy matching and match
    // all that match pattern name, name-99

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

    // Need to find a model within a models function.
    // We haven't created the store yet, so need to use this.constructor,
    // which will be equal to the store by the time it runs.
    const storesWithSlug = await this.constructor.find({slug: slugRegEx});

    if(storesWithSlug.length) {
        // overwrite slug with unique name
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }

    // Now pre-save has done, can move to next step
    next();
});

// Adding a static method to our Store model
storeSchema.statics.getTagsList = function() {
    // Use classic function as need this to by dynamically scoped
    // array is the pipeline, and we put operators in there

    // Before we group by we need to unwind. Stores may have multiple tags
    // and we need to have an instance of the store for each tag,.
    return this.aggregate([
        { $unwind: '$tags'},
        // Group each instance by tags and create a new field called count
        // for each instance we'sunm' by 1.
        { $group: { _id: '$tags', count: { $sum: 1}}},
        // Sort by count descending
        { $sort: { count: -1}}
    ])
};

storeSchema.statics.getTopStores = function() {
    // 'aggregate' is a query function, kind of like 'find'
    // method but can do much more complex stuff in there.

    // Notice how we return this here because in our controller
    // we await the promise that this returns.
    return this.aggregate([
        // 1. Look for stores and populate their reviews

        // Note: aggregate query gets passed straight through to mongo
        // and virtual fields are a mongoose construct, so can't use them here.
        // Notice: This lookup is kind of like mongoose virtual fields
        // Note: the 'reviews' comes from mongo: it takes your model name
        // and adds an 's'

        { $lookup:
                { from: 'reviews', // where we get the data from (which model)
                    localField: '_id', foreignField: 'store', // how we link the data across documents
                    as: 'reviews'} // what we call it
        },

        // 2. Filter for only items that have 2 or more reviews
        // 'reviews.1' syntax for accessing index-based things in Mongo
        // here we are accessing the second item in reviews
        { $match: {'reviews.1': { $exists: true } }},

        // 3. Add average review field
        // 'project' allows us to add a new field
        // '$' by reviews means use the field that s being piped in from prev operator (match)
        { $project: {
            averageRating: { $avg: '$reviews.rating'},

            // have to also explicitly add back in fields here that we want
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews',
                slug: '$$ROOT.slug'
        }},

        // 4. Sort it by the new field, highest average reviews first
        { $sort: { averageRating: -1} },

        // 5. Limit to at most 10
        { $limit: 10 }
    ]);
};

// Find reviews where stores _id property === review store property
// Kind of like an SQL join, but virtual as we don't save the relationship
storeSchema.virtual('reviews', {
    ref: 'Review',
    // '(local) which field on our store needs to match
    // up with which field on our review (foreign)?'
    localField: '_id', // which field on the store
    foreignField: 'store' // which field on review
});

function autopopulate(next){
    this.populate('reviews');
    next();
}

// Whenever we query a store populate the reviews for that store
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

// If the main thing in a file is going to be exporting
// put it on module name.
// It's question of whether importing a function or an object with loads
// of properties on it.
module.exports = mongoose.model('Store', storeSchema);
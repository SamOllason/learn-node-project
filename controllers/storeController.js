const mongoose = require('mongoose');

// mongoose makes sure that each of our
// models are a singleton, so we can use the reference
// that hangs off mongoose here
const Store  = mongoose.model('Store');
const multer = require('multer');

const multerOptions = {
    // We don't want to store original photo.
    // Want to write into memory, resize image and save resized one.
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        // mimetype is used to determine type of image, can't rely on extension!
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            // 'null' indicates to next middleware that all ok
            // and second param is what we want to pass
            next(null, true);
        } else {
            next({message: 'That filetype isn\'t allowed!'}, false);
        }
    }
};

exports.homePage = (req, res) => {
    req.flash('error', `Something happened`);
    req.flash('info', 'something happened');
    res.render('index');
};

exports.addStore = (req, res) => {
    // Use the same template to edit and add stores
    // keeps code DRY
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.createStore = async (req, res) => {
    // Because we are using a strict schema,
    // the store will only pick up the fields we are interested in
    // and ignore other fields on the body.

    // Call save and await here so that we can get access to
    // the slug property of store (which is auto-generated).

    const store = await (new Store(req.body)).save();

    // Fire off connection to mongodb to save data and get back to us.
    // take care here as want to make sure we hear back about success/failure
    // of saving to database before redirecting user
    // Instead of using callback
    await store.save();

    // We included the flash middleware in app.js.
    // Flashes appear when the user makes the next request.
    // Because we redirect a user programmatically below,
    // the flash will appear to show to the user straightaway.
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);

    // Now store is saved redirect user to the store that has been created
    res.redirect(`/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // 1. Query the database for list of all stores

    const stores = await Store.find();
    // console.log({stores});

    // 2. Pass stores to template
    res.render('stores', { title: 'Stores', stores: stores});
};

exports.editStore = async (req, res) => {
    // 1. Find the store given the ID
    // see the ID of the Store on page
    // res.json(req.params.id)
    console.log('edit store');

    const store = await Store.findOne({ _id: req.params.id});
    // res.json(store);

    // 2. Confirm they are the owner of the store
    // TODO
    // 3. Render out the edit form so the user can update their store
    res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) =>{
    // Set the location data to be a point
    req.body.location.type = 'Point';
    // Find and update the store, make sure to use validators
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, // return new store instead of old one
        runValidators: true // use the rules we defined in the schema
    }).exec();

    // Flash a message to the user to tell them know it worked
    req.flash(
        'success',
        `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`
    );

    // Redirect user back to the edit screen they were just on
    res.redirect(`/stores/${store._id}/edit`);
};

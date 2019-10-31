const mongoose = require('mongoose');

// mongoose makes sure that each of our
// models are a singleton, so we can use the reference
// that hangs off mongoose here
const Store  = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid'); // unique ids for each image uploaded
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

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if(!req.file){
        next(); // skip to next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];

    // Adding to request body means it will get saved to db
    req.body.photo = `${uuid.v4()}.${extension}`;

    // now resize
    // either pass a file path or buffer
    const photo = await jimp.read(req.file.buffer);

    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);

    // now have written photo to filesystem, go to next middleware
    next();
};

exports.createStore = async (req, res) => {

    // Used to link a store to an author.
    // Use id of the logged in user.
    req.body.author = req.user._id;

    // Because we are using a strict schema,
    // the store will only pick up the fields we are interested in
    // and ignore other fields on the body.

    // Call save and await here so that we can get access to
    // the slug property of store (which is auto-generated).

    const store = await (new Store(req.body)).save();

    // Fire off connection to mongodb to save data and get back to us.
    // take care here as want to make sure we hear back about success/failure
    // of saving to database before redirecting user
    // instead of using callback.
    await store.save();

    // We included the flash middleware in app.js.
    // Flashes appear when the user makes the next request.
    // Because we redirect a user programmatically below,
    // the flash will appear to show to the user straightaway.
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);

    // Now store is saved redirect user to the store that has been created
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // 1. Query the database for list of all stores

    const stores = await Store.find();
    // console.log({stores});

    // 2. Pass stores to template
    res.render('stores', { title: 'Stores', stores: stores});
};

exports.getStoreBySlug = async (req, res) => {
    // 1. Query the database for a single store.
    // Populating this field means replacing it with the document
    // associated with the author _id.
    const store = await Store.findOne({ slug: req.params.slug}).populate('author');

    // This is all we need to do to render a 404 page because of the error-handling middleware
    if(!store) {
        next();
        return;
    }

    // res.json(store);

    // Render a teomplate
    res.render('store', { title: 'Stores', store: store});
};

const confirmOwner = (store, user) => {
    // store.author is of type object id,
    // have to use equals to compare to a string
    if(!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it!');
    }
};

exports.editStore = async (req, res) => {
    // 1. Find the store given the ID
    // see the ID of the Store on page
    // res.json(req.params.id)

    const store = await Store.findOne({ _id: req.params.id});
    // res.json(store);

    // 2. Confirm they are the owner of the store.
    // If they are not the owner error-handling middleware will catch it
    confirmOwner(store, req.user);
    // 3. Render out the edit form so the user can update their store
    res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
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

exports.getStoresByTag = async (req, res) => {
    const tag  = req.params.tag;

    // if there is no tag then fallback to the second query
    // which will return every store
    const tagQuery = tag || {$exists: true};

    // res.json(tags);

    // Do not use await twice and make code synchronous,
    // instead use promises to get both ajax request fired off at the same time.

    // Get all tags
    // const tags =  await Store.getTagsList();
    const tagsPromise = Store.getTagsList();

    // Get all stores with a specific tag (given by the route)

    const storesPromise = Store.find({tags: tagQuery});

    // await for multiple promises at the same time
    // destruct the data into two variables
    const [ tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    // res.json(result);

    // want to make the tag corresponding highlighted so pass to template
    res.render('tags', {tags, tag, stores, title: 'Tags'});
};

exports.searchStores = async(req, res) => {
    // res.json(req.query);

    const stores = await Store
        // first find stores that match
        .find({
                $text: {
                    $search: req.query.q
                }
            },
        // Use this param to get mongo to project data (add another field)
        // i.e. adding a meta property to each returned store
        // which is calculated using the metadata about each store
            {
                score: { $meta: 'textScore'} // adds a score to each result
             })
        // Want top scoring ones to appear near the top
        .sort({
        score: { $meta: 'textScore'}
    })
    // limit to only 5 results
        .limit(5);

    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            // near operator in MongoDB
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates,
                },
                $maxDistance: 10000 // 10km
            }
        }
    };

    // Keeping endpoint slim
    // const stores = await Store.find(q).select('-author -tags');
    const stores = await Store.find(q).select('slug name description location').limit(10);

    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map'});
};
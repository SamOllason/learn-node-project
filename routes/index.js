const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
// Import one method we need using destructing
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/add', storeController.addStore);

// Catch errors here so that we don't have to do inside each individual route.
// This will let the error happen inside the route, catch it inside the HOF
// and use the next function to pass on to appropriate error-handling middleware.
router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);

router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);


// Use a wildcard here to match all URLs of this pattern.
// When we get the request object we will have access to the id as a variable
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);


module.exports = router;

const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
// Import one method we need using destructing
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/add',
    authController.isLoggedIn, //check user is logged in before showing them the addStore page
    storeController.addStore
);

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
router.post('/login', authController.login);

router.get('/register', userController.registerForm);

// 1. Validate registration data
// Want to do as many checks as possible on model but
// sometimes have to do extra inside controller
// 2. Register the users
// 3. Automatically log the user in
router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login
);

router.get('/logout', authController.logout);

router.get('/account',
    authController.isLoggedIn,
    userController.account
);

router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgotPassword));
router.get('/account/reset/:token', catchErrors(authController.resetPassword));
router.post('/account/reset/:token',
    authController.confirmedPasswords,
    catchErrors(authController.updatePassword)
);

router.get('/map', storeController.mapPage);
router.get('/hearts',
    // There no link to this page that users can click,
    // however someone could send a URL to someone else and we want catch against this.
    // A non-logged in user would see an error as there is no 'user' property on the req to access
    // and this is as neat way of handling it.
    authController.isLoggedIn,
    catchErrors(storeController.getHearts)
);

router.post('/reviews/:id',
    authController.isLoggedIn,
    catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(storeController.getTopStores));

/*
    API
 */

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;

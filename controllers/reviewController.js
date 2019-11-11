const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {

    req.body.author = req.user._id;

    // So we can connect the store to a review
    // by 'populating' the review.
    req.body.store  = req.params.id;

    const newReview = new Review(req.body);
    await newReview.save();

    req.flash('success', 'Review Saved!');
    // Nav users back to the store they just reviewed
    res.redirect('back')
};


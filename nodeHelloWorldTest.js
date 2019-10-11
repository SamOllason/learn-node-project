// // const express = require('express')
// // // // const app = express()
// // // // const port = 3000
// // // //
// // // // app.get('/', (req, res) => res.send('Hello World!'))
// // // //
// // // // app.listen(port, () => console.log(`Example app listening on port ${port}!`))
//
//
// var express = require('express');
// var session = require('express-session');
// var MongoDBStore = require('connect-mongodb-session')(session);
//
// var app = express();
// var numExpectedSources = 2;
// var store = new MongoDBStore(
//     {
//         uri: 'mongodb+srv://dang-test1:dang@dang-thats-delicious-b8go7.mongodb.net',
//     },
//     function(error) {
//         console.log({error});
//         // Should have gotten an error
//     });
//
// store.on('error', function(error) {
//     // Also get an error here
//     console.log({error});
// });
//
// app.use(session({
//     secret: 'This is a secret',
//     cookie: {
//         maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
//     },
//     store: store,
//     // Boilerplate options, see:
//     // * https://www.npmjs.com/package/express-session#resave
//     // * https://www.npmjs.com/package/express-session#saveuninitialized
//     resave: true,
//     saveUninitialized: true
// }));
//
// app.get('/', function(req, res) {
//     res.send('Hello ' + JSON.stringify(req.session));
// });
//
// server = app.listen(3000);


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dang-test1:dang@dang-thats-delicious-b8go7.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
    const collection = client.db("test").collection("devices");
    console.log({collection});
    // perform actions on the collection object
    client.close();
});
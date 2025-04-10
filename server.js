const express = require('express')
const path = require('path');




/* create the server */
const app = express();
const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


/* host public/ directory to serve: images, css, js, etc. */
app.use(express.static('styles'));

/* path routing and endpoints */
app.use('/', require('./path_router'));

/* use public directory for client side JS */
app.use(express.static('public'));

app.use(express.json());  // for parsing application/json
app.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded


/* start the server */
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
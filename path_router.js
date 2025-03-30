const express = require('express');
const fileUpload = require('express-fileupload');
const pool = require('./db');
const bodyParser = require('body-parser');
const path = require('path');

router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(fileUpload());

router.get('/', async (req, res) => {
    const db = pool.promise();
    
    /*query = "select * from Flat;";

    try{
        const [rows, fields] = await db.query(query);
        data = rows
        console.log(data);
    }catch (err){
        console.error("query didn't work", err);
    }*/

    res.render('login'); //change later when homepage is created
});

router.get('/login', async (req, res) => {
    res.render('login');
});

router.get('/signup', async (req, res) => {
    res.render('signup');
});

router.get('/groceries', async (req, res) => {
    res.render('groceries');
});

router.post('/signup/submit', async (req, res) => {

    const Uname = req.body.Uname;
    const email = req.body.email;
    const pwd = req.body.pwd;


    const db = pool.promise();
    const status_query = `SELECT Email FROM User WHERE Email = ?`;
    try {
        const [rows] = await db.query(status_query, [email]);

        if (rows.length === 0) {
            const dbdel = pool.promise();
            const status_query_del = `INSERT INTO User (Email, Username, Password) VALUES (?, ?, ?);`;
            try {
                await dbdel.query(status_query_del, [email, Uname, pwd]);
            } catch (err) {
                console.error(err + "\n\n\n");
                return res.status(500).send("Database error. Please try again later.");
            }
        } else {
            return res.redirect('/login');
        }
    } catch (err) {
        console.error("You havent set up the database yet!");
    }

    return res.redirect('/signup');
});

module.exports = router;

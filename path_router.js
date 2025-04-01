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



router.get('/bills', (req, res) => {
       /*const bills = getBillsFromDatabase() || []; // Replace with actual logic to get bills */

    // Dummy data 
    const bills = [
        { title: "Electricity", amount: 100, due_date: "2025-05-01", payment_status: "Unpaid", amount_paid: 0, bill_id: 1 },
        { title: "Internet", amount: 50, due_date: "2025-04-15", payment_status: "Paid", amount_paid: 50, bill_id: 2 }
    ];

    res.render('Bills', { bills: bills });  // Pass 'bills' to the view
});




router.post('/login/submit', async (req, res) => {

    const email = req.body.email;
    const pwd = req.body.pwd;


    const db = pool.promise();
    const status_query = `SELECT User_ID FROM User WHERE Email = ? AND Username = ?;`;
    try {
        const [rows] = await db.query(status_query, [email, pwd]);        
    } catch (err) {
        console.error("You havent set up the database yet!" + err);
    }

    return res.redirect('/groceries');
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
        } else if (rows.length > 0) {
            return res.status(400).send("Email already exists");
        } else {
            return res.redirect('/signup');
        }
    } catch (err) {
        console.error("You havent set up the database yet!");
    }

    return res.redirect('/groceries');
});





module.exports = router;

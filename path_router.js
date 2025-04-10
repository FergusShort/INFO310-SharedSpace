const express = require('express');
const fileUpload = require('express-fileupload');
const pool = require('./db');
const bodyParser = require('body-parser');
const path = require('path');
const { get } = require('express/lib/response');


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

router.get('/createGroup', async (req, res) => {
    res.render('createGroup');
});

router.get('/joinGroup', async (req, res) => {
    res.render('joinGroup');
});



router.get('/groceries', async (req, res) => {
    res.render('groceries');
});

router.get('/chores', async (req, res) => {
    res.render('chores');
});



router.get('/bills', async (req, res) => {
    const bills = await getBillsFromDatabase();
    res.render('bills', { bills: Array.isArray(bills) ? bills : [] });
});


const getBillsFromDatabase = async () => {
    const db = pool.promise();
    const query = `SELECT * FROM Bills;`;

    try {
        const [rows, fields] = await db.query(query);
        return rows;
    } catch (err) {
        console.error("query didn't work", err);
        return [];
    }
};



router.post('/bills/add', async (req, res) => {
    const flat_id = 1;
    const amount = req.body.amount;
    const amount_paid = req.body.amount_paid || 0;
    const due_date = req.body.due_date || null;
    const status = req.body.status || 'A';
    let payment_status = req.body.payment_status || 'U';
    const title = req.body.title;
    const recurring = req.body.recurring || false;
    const time_period = req.body.time_period || null;
    const overdue = req.body.overdue || false;

    if (amount_paid > 0 && payment_status === 'U') {
        payment_status = 'P';
    } else if (amount_paid >= amount) {
        payment_status = 'F';
    }

    const db = pool.promise();
    const insertQuery = `
        INSERT INTO Bills (Flat_ID, Amount, Amount_Paid, Due_Date, Status, Payment_Status, Title, Recurring, Time_period, Overdue, Initial_Amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
        await db.query(insertQuery, [flat_id, amount, amount_paid, due_date, status, payment_status, title, recurring, time_period, overdue, amount]); 
        return res.redirect('/bills');
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error adding bill.");
    }
});



router.post('/bills/pay', async (req, res) => {
    const bill_id = req.body.bill_id;
    const paymentAmount = parseFloat(req.body.amount || req.body.shareAmount || 0); 
    const db = pool.promise();

    try {
        const updateQuery = `
            UPDATE Bills
            SET Amount_Paid = Amount_Paid + ?,
                Payment_Status = CASE
                    WHEN Amount_Paid + ? >= Amount THEN 'F'  -- Full paid
                    WHEN Amount_Paid > 0 THEN 'P'  -- Partially paid
                    ELSE 'U'  -- Unpaid
                END
            WHERE Bill_ID = ?;
        `;

        await db.query(updateQuery, [paymentAmount, paymentAmount, bill_id]);

        // Check if the bill is fully paid and delete it if it is
        const checkQuery = `SELECT Amount, Amount_Paid, Initial_Amount FROM Bills WHERE Bill_ID = ?`;
        const [rows] = await db.query(checkQuery, [bill_id]);
    
        if (rows.length > 0) {
            const bill = rows[0];
            if (bill.Amount_Paid >= bill.Initial_Amount) { 
                const deleteQuery = `DELETE FROM Bills WHERE Bill_ID = ?`;
                await db.query(deleteQuery, [bill_id]);
            }
        }
    
        return res.redirect('/bills');
    } catch (err) {
        console.error("Error in /bills/pay route:", err);
        return res.status(500).send("Error processing payment.");
    }
});


router.post('/bills/delete', async (req, res) => {
    const bill_id = req.body.bill_id;

    const db = pool.promise();

    try {
        await db.query(`DELETE FROM Bills WHERE Bill_ID = ?;`, [bill_id]);
        return res.redirect('/bills');
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error deleting bill.");
    }
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

    return res.redirect('/createGroup');
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

    return res.redirect('/createGroup');
});


// Route to add a chore
router.post('/chores/add', async (req, res) => {
    const flat_id = 1; // Replace with actual flat ID later
    const {title, comment, urgency} = req.body;
    const db = pool.promise();
    const insertQuery = `
        INSERT INTO Chores (Flat_ID, Priority, Title, Description)
        VALUES (?, ?, ?, ?);
    `;

    try {
        const [result] = await db.query(insertQuery, [flat_id, urgency, title, comment]);
        const choreId = result.insertId; // Get the inserted chore ID

        res.status(201).json({ message: 'Chore added successfully', choreId });
    } catch (err) {
        console.error("Error adding chore:", err);
        res.status(500).send('Error adding chore.');
    }
});

// Route to delete a chore 
router.post('/chores/delete', async (req, res) => {
    const choreId = req.body.choreId; // Get the chore ID 

    const db = pool.promise();
    const deleteQuery = `DELETE FROM Chores WHERE Chore_ID = ?;`;

    try {
        await db.query(deleteQuery, [choreId]);
        res.status(200).send('Chore deleted successfully');
    } catch (err) {
        console.error(deleteQuery, err);
        res.status(500).send('Error deleting chore');
    }
});

/* INDEX (HomePage) CODE */
router.get('/home', async (req, res) => { 
    res.render('index');
});

module.exports = router;

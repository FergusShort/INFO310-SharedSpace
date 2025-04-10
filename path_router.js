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



router.get("/bills", async (req, res) => {
  const sortType = req.query.sort || "all";
  const errorMessage = req.query.error;

  try {
    const bills = await getBillsFromDatabase(sortType);
    res.render("bills", { bills, sort: sortType, error: errorMessage });
  } catch (error) {
    res.status(500).send("Error fetching bills");
  }
});


async function getBillsFromDatabase(sortType = "all") {
  const db = pool.promise();
  const today = new Date();

  let query = "SELECT * FROM Bills";
  let params = [];

  if (sortType === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    query = `SELECT * FROM Bills WHERE Due_Date BETWEEN ? AND ?`;
    params = [today, nextWeek];
  } else if (sortType === "month") {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    query = `SELECT * FROM Bills WHERE Due_Date BETWEEN ? AND ?`;
    params = [today, nextMonth];
  }

  try {
    const [rows] = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error("Error fetching bills from database:", error);
    throw new Error("Unable to fetch bills from the database");
  }
}



router.post("/bills/add", async (req, res) => {
  const flat_id = 1;
  const initial_amount = parseFloat(req.body.amount);
  const amount_paid = 0.00;
  const amount_left = initial_amount;
  const due_date = req.body.due_date ? new Date(req.body.due_date) : null;
  let payment_status = "U";
  const title = req.body.title;
  const recurring = req.body.recurring === 'on' ? 1 : 0;
  const time_period = parseInt(req.body.time_period) || null;
  const overdue = req.body.overdue || false;
  const description = req.body.description || "";

  if (initial_amount === 0) {
    payment_status = "F";
  }

  const db = pool.promise();
  const insertQuery = `
    INSERT INTO Bills (
        Flat_ID, Initial_Amount, Amount_Left, Amount_Paid, Due_Date,
         Payment_Status, Title, Description,
        Recurring, Time_period, Overdue
    )
    VALUES (?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?);
`;

  try {
    // Insert the initial bill
    await db.query(insertQuery, [
      flat_id,
      initial_amount,
      amount_left,
      amount_paid,
      due_date,
      payment_status,
      title,
      description,
      recurring,
      time_period,
      overdue,
    ]);

    res.redirect("/bills");
  } catch (err) {
    console.error("Error inserting bill:", err);
    res.status(500).send("Internal Server Error");
  }
});


router.post('/bills/pay', async (req, res) => {
  const bill_id = req.body.bill_id;
  const amountPaid = parseFloat(req.body.amount_paid || req.body.shareAmount || 0);
  const db = pool.promise();

  try {
      // Retrieve the bill data, including Recurring and Time_period
      const checkQuery = `
          SELECT Initial_Amount, Amount_Left, Amount_Paid, Due_Date, Recurring, Time_period, Flat_ID, Title, Description, Overdue
          FROM Bills WHERE Bill_ID = ?;
      `;
      const [rows] = await db.query(checkQuery, [bill_id]);

      if (rows.length === 0) {
          return res.status(404).send("Bill not found.");
      }

      const bill = rows[0];
      const currentAmountLeft = parseFloat(bill.Amount_Left);
      const currentAmountPaid = parseFloat(bill.Amount_Paid);
      const initialAmount = parseFloat(bill.Initial_Amount);

      if (amountPaid > currentAmountLeft) {
          return res.redirect('/bills?error=amount_too_large');
      }

      if (currentAmountLeft <= 0) {
          return res.status(400).send("This bill is already fully paid.");
      }

      const newAmountPaid = currentAmountPaid + amountPaid;
      const newAmountLeft = currentAmountLeft - amountPaid;

      // Ensure amount_left doesn't go below zero
      const updatedAmountLeft = Math.max(0, newAmountLeft);

      let paymentStatus = 'P'; // Partially paid by default
      if (updatedAmountLeft <= 0) {
          paymentStatus = 'F'; // Fully paid
      }

      // Update Amount_Paid and Amount_Left
      const updateQuery = `
          UPDATE Bills
          SET Amount_Paid = ?, Amount_Left = ?, Payment_Status = ?
          WHERE Bill_ID = ?;
      `;
      await db.query(updateQuery, [newAmountPaid, updatedAmountLeft, paymentStatus, bill_id]);

      // Create a new recurring bill and delete the old one if fully paid and recurring
      if (updatedAmountLeft <= 0 && bill.Recurring && bill.Time_period) {
          const nextDueDate = new Date(bill.Due_Date);
          nextDueDate.setDate(nextDueDate.getDate() + bill.Time_period);
          const insertRecurringQuery = `
              INSERT INTO Bills (
                  Flat_ID, Initial_Amount, Amount_Left, Amount_Paid, Due_Date,
                   Payment_Status, Title, Description,
                  Recurring, Time_period, Overdue
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
          await db.query(insertRecurringQuery, [
              bill.Flat_ID,
              bill.Initial_Amount,
              bill.Initial_Amount,
              0.00,
              nextDueDate,
              "U",
              bill.Title,
              bill.Description,
              bill.Recurring,
              bill.Time_period,
              bill.Overdue
          ]);

          // Delete the original, now fully paid, recurring bill
          const deleteQuery = `
              DELETE FROM Bills WHERE Bill_ID = ?;
          `;
          await db.query(deleteQuery, [bill_id]);
      } else if (updatedAmountLeft <= 0 && !bill.Recurring) {
          const deleteQuery = `
              DELETE FROM Bills WHERE Bill_ID = ?;
          `;
          await db.query(deleteQuery, [bill_id]);
      }

      // Redirect to the bills page
      return res.redirect('/bills');
  } catch (err) {
      console.error("Error in /bills/pay route:", err);
  }
});




router.post("/bills/delete", async (req, res) => {
const bill_id = req.body.bill_id;

const db = pool.promise();

try {
  await db.query(`DELETE FROM Bills WHERE Bill_ID = ?;`, [bill_id]);
  return res.redirect("/bills");
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


module.exports = router;

const express = require("express");
const bcrypt = require('bcrypt');
const fileUpload = require("express-fileupload");
const pool = require("./db");
const bodyParser = require("body-parser");
const { format } = require("date-fns");

router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(fileUpload());

router.get("/", async (req, res) => {
  res.render("login");
});

router.get("/login", async (req, res) => {
  res.render("login");
});

router.get("/signup", async (req, res) => {
  res.render("signup");
});

router.get("/createGroup", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup");
  }
  return res.render("createGroup");
});

router.get("/joinGroup", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup");
  }
  res.render("joinGroup");
});

router.get("/groceries", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup");
  } else if(!req.session.flat_Id) {
    return res.render("createGroup");
  }
  res.render("groceries");
});

async function getChoresFromDatabase(flatID) {
  const db = pool.promise();
  try {
      const [chores] = await db.query("SELECT * FROM Chores WHERE Flat_ID = ?", [flatID]);
      return chores;
  } catch (error) {
      console.error("Error fetching chores from database:", error);
      throw new Error("Unable to fetch chores from the database");
  }
}

router.get("/chores", async (req, res) => {
  if (!req.session.userId) {
      return res.render("signup");
  } else if (!req.session.flat_Id) {
      return res.redirect("/createGroup");
  }

  const flat_id = req.session.flat_Id;

  try {
      const chores = await getChoresFromDatabase(flat_id);

      chores.forEach((chore) => {
          chore.timestamp = new Date();
      });

      const choresByUrgency = {
          urgent: chores.filter((chore) => chore.Priority === "urgent"),
          "not-so-urgent": chores.filter((chore) => chore.Priority === "not-so-urgent"),
          "low-urgency": chores.filter((chore) => chore.Priority === "low-urgency"),
      };

      res.render("chores", { chores: choresByUrgency });
  } catch (err) {
      console.error("Error fetching chores:", err);
      res.status(500).send("Error fetching chores.");
  }
});

async function getUsersInFlat(flatID) {
  const db = pool.promise();
  const [rows] = await db.query("SELECT COUNT(*) AS count FROM User WHERE Flat_ID = ?", [flatID]);
  return rows[0].count;
}

router.get("/bills", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup");
  } else if(!req.session.flat_Id) {
    return res.render("createGroup");
  }
  const sortType = req.query.sort || "all";
  const errorMessage = req.query.error;
  const flatID = req.session.flat_Id;
  const usersInFlat = await getUsersInFlat(flatID); 
  const numPeople = usersInFlat > 0 ? usersInFlat : 1;

  try {
    const bills = await getBillsFromDatabase(sortType, flatID);
    res.render("bills", {
      bills,
      sort: sortType,
      error: errorMessage,
      numPeople: numPeople
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).send("Error fetching bills");
  }
});

async function getBillsFromDatabase(sortType = "all", flatID) {
  
  const db = pool.promise();
  const today = new Date();

  let query = "SELECT * FROM Bills WHERE Flat_ID = ?";
  let params = [flatID];

  if (sortType === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    query = `SELECT * FROM Bills WHERE Flat_ID = ? AND Due_Date BETWEEN ? AND ?`;
    params = [flatID, today, nextWeek];
  } else if (sortType === "month") {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    query = `SELECT * FROM Bills WHERE Flat_ID = ? AND Due_Date BETWEEN ? AND ?`;
    params = [flatID, today, nextMonth];
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
  const flat_ID = req.session.flat_Id;
  const initial_amount = parseFloat(req.body.amount);
  const amount_left = initial_amount;
  const due_date = req.body.due_date ? new Date(req.body.due_date) : null;
  let payment_status = "U";
  const title = req.body.title;
  const recurring = req.body.recurring === "on" ? 1 : 0;
  const time_period = parseInt(req.body.time_period) || null;
  const overdue = req.body.overdue || false;
  const description = req.body.description || "";
  const db = pool.promise();


  const insertQuery = `
    INSERT INTO Bills (
        Flat_ID, Initial_Amount, Amount_Left, Due_Date,
         Payment_Status, Title, Description,
        Recurring, Time_period, Overdue
    )
    VALUES (?, ?, ?, ?,  ?, ?, ?, ?, ?, ?);`;

  try {
    // Insert the initial bill
    await db.query(insertQuery, [
      flat_ID,
      initial_amount,
      amount_left,
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

router.post("/bills/pay", async (req, res) => {
    const bill_id = req.body.bill_id;
    const amountPaid = parseFloat(req.body.amount_paid || 0);
    const db = pool.promise();

    if (isNaN(amountPaid) || amountPaid <= 0) {
        return res.status(400).send("Invalid amount paid.");
    }

    try {
        const checkQuery = `SELECT Initial_Amount, Amount_Left, Due_Date, Recurring, Time_period, Flat_ID, Title, Description FROM Bills WHERE Bill_ID = ?;`;
        const [rows] = await db.query(checkQuery, [bill_id]);
        if (!rows || rows.length === 0) {
            return res.status(404).send("Bill not found.");
        }
        const bill = rows[0];

        const currentAmountLeft = parseFloat(bill.Amount_Left);
        const newAmountLeft = Math.max(0, currentAmountLeft - amountPaid);
        let paymentStatus = newAmountLeft === 0 ? "F" : "P";

        const updateQuery = `UPDATE Bills SET Amount_Left = ?, Payment_Status = ? WHERE Bill_ID = ?;`;
        await db.query(updateQuery, [newAmountLeft, paymentStatus, bill_id]);

        if (newAmountLeft === 0 && bill.Recurring && bill.Time_period) {
            // Calculate the next due date
            const nextDueDate = new Date(bill.Due_Date);
            nextDueDate.setDate(nextDueDate.getDate() + bill.Time_period);

            const insertRecurringQuery = `
                INSERT INTO Bills (
                    Flat_ID, Initial_Amount, Amount_Left, Due_Date,
                    Payment_Status, Title, Description,
                    Recurring, Time_period, Overdue
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            await db.query(insertRecurringQuery, [
                bill.Flat_ID,
                bill.Initial_Amount,
                bill.Initial_Amount,
                nextDueDate,
                "U",
                bill.Title,
                bill.Description,
                bill.Recurring,
                bill.Time_period,
                0
            ]);
        }

        if (newAmountLeft === 0 && !bill.Recurring) {
            const deleteQuery = `DELETE FROM Bills WHERE Bill_ID = ?`;
            await db.query(deleteQuery, [bill_id]);
        }

        return res.redirect("/bills");
    } catch (error) {
        console.error("Error paying bill:", error);
        return res.status(500).send("Error processing payment.");
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

router.post("/login/submit", async (req, res) => {
  const email = req.body.email;
  const pwd = req.body.pwd;

  const db = pool.promise();
  const status_query = `SELECT User_ID, Flat_ID, Password FROM User WHERE Email = ? OR Username = ?`;

  try {
    const [rows] = await db.query(status_query, [email, email]);

    if (rows.length > 0) {
      const storedHash = rows[0].Password;
      const match = await bcrypt.compare(pwd, storedHash);

      if (match) {
        req.session.userId = rows[0].User_ID;

        if (rows[0].Flat_ID != null) {
          req.session.flat_Id = rows[0].Flat_ID;
          return res.redirect("/calendar");
        } else {
          return res.redirect("/createGroup");
        }
      }
    }

    return res.status(401).send("Invalid email/username or password");

  } catch (err) {
    console.error("Login error:" + err);
    return res.redirect("/login");
  }
  return res.redirect("/signup");
});


router.post("/signup/submit", async (req, res) => {
  const Uname = req.body.Uname;
  const email = req.body.email;
  const pwd = req.body.pwd;

  const db = pool.promise();
  const status_query = `SELECT Email FROM User WHERE Email = ? OR Username = ?`;
  try {
    const [rows] = await db.query(status_query, [email, Uname]);

    if (rows.length === 0) {
      const dbdel = pool.promise();

      const hashAmount = 10;
      const hashedPwd = await bcrypt.hash(pwd, hashAmount);

      const status_query_del = `INSERT INTO User (Email, Username, Password) VALUES (?, ?, ?);`;
      try {
        await dbdel.query(status_query_del, [email, Uname, hashedPwd]);
      } catch (err) {
        console.error(err + "\n\n\n");
        return res.status(500).send("Database error. Please try again later.");
      }
    } else if (rows.length > 0) {
      return res.status(400).send("Email or Username already exists");
    } else {
      return res.redirect("/signup");
    }
  } catch (err) {
    console.error("You havent set up the database yet!");
  }

  const dbb = pool.promise();
  const status_queryy = `SELECT User_ID FROM User WHERE Email = ?`;
  try {
    const [rows] = await dbb.query(status_queryy, email);
    req.session.userId = rows[0].User_ID;
  } catch (err) {
    console.error("An error occured: " + err);
  }
  return res.redirect("/createGroup");
});

router.post("/createGroup/create", async (req, res) => {
  const groupName = req.body.groupName;
  const groupID = await makeFlatID();

  const db = pool.promise();
  const status_query = `INSERT INTO Flat (Flat_ID, GroupName) VALUE (?, ?);`;
  try {
    const [rows] = await db.query(status_query, [groupID, groupName]);
  } catch (err) {
    console.error("You havent set up the database yet!!" + err);
  }

  const dbb = pool.promise();
  const status_queryy = `UPDATE User SET Flat_ID = ? WHERE User_ID = ?;`;
  try {
    const [row] = await dbb.query(status_queryy, [groupID, req.session.userId]);
    req.session.flat_Id = groupID;
  } catch (err) {
    console.error("You havent set up the database yet!!!" + err);
  }

  return res.redirect("/calendar");
});

router.post("/joinGroup/join", async (req, res) => {
  const groupCode = req.body.groupCode;
  const userID = req.session.userId;

  const db = pool.promise();
  const status_query = `SELECT Flat_ID FROM Flat WHERE Flat_ID = ?;`;
  try {
    const [rows] = await db.query(status_query, groupCode);
    if (rows.length > 0) {
      const dbb = pool.promise();
      const status_queryy = `UPDATE User SET Flat_ID = ? WHERE User_ID = ?;`;
      try {
        const [row] = await dbb.query(status_queryy, [groupCode, userID]);
        req.session.flat_Id = groupCode;
      } catch (err) {
        console.error("You havent set up the database yet!!!" + err);
      }
    }
  } catch (err) {
    console.error("You havent set up the database yet!!" + err);
  }

  return res.redirect("/calendar");
});

async function makeFlatID() {
  const iD = generateFlatID();

  const db = pool.promise();
  const status_query = `SELECT Flat_ID FROM Flat WHERE Flat_ID = ?;`;
  try {
    const [rows] = await db.query(status_query, iD);
    if (rows.length > 0) {
      iD = makeFlatID();
    }
  } catch (err) {
    console.error("You havent set up the database yet!" + err);
  }
  return iD;
}

function generateFlatID() {
  const alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];

  let FlatID = "";

  for (let i = 0; i < 4; i++) {
    FlatID += alphabet[Math.floor(Math.random() * 26)];
  }

  return FlatID;
}

router.post("/chores/add", async (req, res) => {
  const flat_id = req.session.flat_Id;
  const { title, comment, urgency } = req.body;
  const db = pool.promise();

  try {
    const insertQuery = `
      INSERT INTO Chores (Flat_ID, Priority, Title, Description)
      VALUES (?, ?, ?, ?);
    `;

    await db.query(insertQuery, [flat_id, urgency, title, comment]);

    res.redirect("/chores");
  } catch (err) {
    console.error("Error adding chore:", err);
    res.status(500).send("Error adding chore.");
  }
});

router.post("/chores/delete", async (req, res) => {
  const choreId = req.body.chore_id;

  const db = pool.promise();
  const deleteQuery = `DELETE FROM Chores WHERE Chore_ID = ?;`;

  try {
    await db.query(deleteQuery, [choreId]);
    res.redirect("/chores");
  } catch (err) {
    console.error("Error deleting chore:", err);
    res.status(500).send("Error deleting chore");
  }
});

/* INDEX (HomePage) CODE */
router.get("/calendar", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup");
  } else if(!req.session.flat_Id) {
    return res.render("createGroup");
  }
  const db = pool.promise();
  const query = `
    SELECT Event_ID as id, Title as title, Description as descr, Start_Time as start, End_Time as end
    FROM Events where Flat_ID = ?;
  `;

  try {
    if (!req.session.flat_Id) {
      console.error("Flat ID is missing in session.");
      return res.status(400).send("Flat ID is missing.");
    }

    const [rows, fields] = await db.query(query, req.session.flat_Id);
    res.status(200);
    let events = rows; // Declare events with let
    for (let i = 0; i < events.length; i++) {
      events[i].start = format(new Date(events[i].start), "yyyy-MM-dd HH:mm:SS");
      events[i].end = format(new Date(events[i].end), "yyyy-MM-dd HH:mm:SS");
    }

    res.render("calendar", { events: events });
  } catch (err) {
    console.error("Error fetching events:", err); // More descriptive error log
    res.status(500).send("Server error.");
  }
});

router.post("/calendar/addevent", async (req, res) => {
  const db = pool.promise();
  const stmt = `
    INSERT INTO Events(Flat_ID, Title, Description, Start_Time, End_Time)
    VALUES (?, ?, ?, ?, ?);
  `;
  const flat_id = req.session.flat_Id;
  const title = req.body.title;
  const desc = req.body.desc;
  const start = format(new Date(req.body.start_time), "yyyy-MM-dd HH:mm:SS"); // Corrected format
  const end = format(new Date(req.body.end_time), "yyyy-MM-dd HH:mm:SS");   // Corrected format

  try {
    await db.query(stmt, [flat_id, title, desc, start, end]);
    res.redirect("/calendar"); // Redirect on success
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).send("Error adding event."); // Send error response
  }
});

module.exports = router;
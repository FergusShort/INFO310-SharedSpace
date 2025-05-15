const express = require("express");
const bcrypt = require("bcrypt");
const fileUpload = require("express-fileupload");
const pool = require("./db");
const bodyParser = require("body-parser");
const { format } = require("date-fns");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(fileUpload());

router.get("/", async (req, res) => {
  return res.render("login", {error: null,formData: {}});
});

router.get("/login", async (req, res) => {
  return res.render("login", {error: null,formData: {}});
});

router.get("/signup", (req, res) => {
  res.render("signup", { error: null, formData: {} });
});

router.get("/logout", async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Could not log out. Try again.");
    }
    res.clearCookie("connect.sid");
    return res.render("login", {error: null,formData: {}});
  });
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


router.get("/home", async (req, res) => {
  if (!req.session.userId || !req.session.flat_Id) {
    return res.render("signup", { error: null, formData: {} });
  }

  const flatId = req.session.flat_Id;
  const db = pool.promise();

  const events_query = `SELECT Title AS title, Start_Time AS date FROM Events WHERE Flat_ID = ? AND Start_Time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) ORDER BY Start_Time ASC;`;
  const tasks_query = `SELECT Title AS name, Description, Chore_ID FROM Chores WHERE Flat_ID = ? AND Completed = FALSE ORDER BY Priority DESC;`;
  const bills_query = `SELECT Title AS name, Initial_Amount AS amount, Due_Date AS dueDate FROM Bills WHERE Flat_ID = ? AND (Due_Date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) OR Due_Date < CURDATE()) ORDER BY Due_Date ASC;`;
  const groceryQuery = `SELECT Item as item, Quantity as quantity, Price as price, Checked_State as checked FROM Groceries WHERE Flat_ID = ? ORDER BY Checked_State ASC, Item ASC;`;

  try {
    const [eventRows] = await db.query(events_query, [flatId]);
    const [taskRows] = await db.query(tasks_query, [flatId]);
    const [billRows] = await db.query(bills_query, [flatId]);
    const [grocerieRows] = await db.query(groceryQuery, [flatId]);


    return res.render("home", {
      events: eventRows,
      tasks: taskRows,
      bills: billRows,
      groceries: grocerieRows,
    });

  } catch (err) {
    console.error("Home route error:\n", err);
    return res.status(500).send("Error loading dashboard. Please try again.");
  }
});

router.get("/groceries", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup", { error: null, formData: {} });
  } else if (!req.session.flat_Id) {
    return res.render("createGroup");
  }

  const db = pool.promise();
  const flatId = req.session.flat_Id;

  try {
    const [groceries] = await db.query(
      `SELECT * FROM Groceries WHERE Flat_ID = ?`,
      [flatId]
    );
    res.render("groceries", { groceries });
  } catch (err) {
    console.error("Error fetching groceries:", err);
    res.status(500).send("Error fetching groceries.");
  }
});

router.get("/chores", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup", { error: null, formData: {} });
  } else if (!req.session.flat_Id) {
    return res.redirect("/createGroup");
  }

  const flat_id = req.session.flat_Id;

  try {
    const db = pool.promise();
    const [chores] = await db.query(
      `
            SELECT Chore_ID, Title, Description, Priority
            FROM Chores 
            WHERE Flat_ID = ?
        `,
      [flat_id]
    );

    const choresByUrgency = {
      urgent: chores.filter((chore) => chore.Priority === "urgent"),
      "not-so-urgent": chores.filter(
        (chore) => chore.Priority === "not-so-urgent"
      ),
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
  const [rows] = await db.query(
    "SELECT COUNT(*) AS count FROM User WHERE Flat_ID = ?",
    [flatID]
  );
  return rows[0].count;
}

router.get("/bills", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup", { error: null, formData: {} });
  } else if (!req.session.flat_Id) {
    return res.render("createGroup");
  }
  const sortType = req.query.sort || "all";
  const errorMessage = req.query.error;
  const flatID = req.session.flat_Id;
  const userId = req.session.userId; // Get the current user's ID
  const usersInFlat = await getUsersInFlat(flatID);
  const numPeople = usersInFlat > 0 ? usersInFlat : 1;

  try {
    const bills = await getBillsWithUserPaymentStatus(sortType, flatID, userId);
    res.render("bills", {
      bills,
      sort: sortType,
      error: errorMessage,
      numPeople: numPeople,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).send("Error fetching bills");
  }
});

async function getBillsWithUserPaymentStatus(sortType = "all", flatID, userId) {
  const db = pool.promise();
  const today = new Date();

  let billQuery = `
    SELECT b.*,
           COALESCE((SELECT up.User_Payment_status
                     FROM user_payments up
                     WHERE up.Bill_ID = b.Bill_ID AND up.User_ID = ?), NULL) AS User_Payment_Status,
           COALESCE((SELECT up.User_Amount_paid
                     FROM user_payments up
                     WHERE up.Bill_ID = b.Bill_ID AND up.User_ID = ?), 0.00) AS User_Amount_paid,
           COALESCE((SELECT up.User_Share_amount
                     FROM user_payments up
                     WHERE up.Bill_ID = b.Bill_ID AND up.User_ID = ?), NULL) AS User_Share_amount
    FROM Bills b
    WHERE b.Flat_ID = ?
  `;
  let billParams = [userId, userId, userId, flatID];


  if (sortType === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    billQuery += ` AND (Due_Date BETWEEN ? AND ? OR Due_Date < CURDATE()) ORDER BY Due_Date ASC`;
    billParams.push(today, nextWeek);
  } else if (sortType === "month") {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    billQuery += ` AND (Due_Date BETWEEN ? AND ? OR Due_Date < CURDATE()) ORDER BY Due_Date ASC`;
    billParams.push(today, nextMonth);
  } else {
    // Default case: Show all upcoming and past due bills?
    billQuery += ` AND Due_Date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) OR Due_Date < CURDATE() ORDER BY Due_Date ASC`;
    // If you want to show all past and future, you might remove the date condition entirely
  }

  try {
    const [rows] = await db.query(billQuery, billParams);
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
  const userId = req.session.userId;
  const db = pool.promise();

  if (isNaN(amountPaid) || amountPaid <= 0) {
    return res.status(400).send("Invalid amount paid.");
  }

  try {
    const checkBillQuery = `SELECT Initial_Amount, Amount_Left, Due_Date, Recurring, Time_period, Flat_ID, Title, Description FROM Bills WHERE Bill_ID = ?;`;
    const [billRows] = await db.query(checkBillQuery, [bill_id]);
    if (!billRows || billRows.length === 0) {
      return res.status(404).send("Bill not found.");
    }
    const bill = billRows[0];

    const currentAmountLeft = parseFloat(bill.Amount_Left);
    const newAmountLeft = Math.max(0, currentAmountLeft - amountPaid);
    let paymentStatus = newAmountLeft === 0 ? "F" : "P";

    const updateBillQuery = `UPDATE Bills SET Amount_Left = ?, Payment_Status = ? WHERE Bill_ID = ?;`;
    await db.query(updateBillQuery, [newAmountLeft, paymentStatus, bill_id]);

    // Get the number of users in the flat
    const [billUsers] = await db.query(
      "SELECT User_ID FROM User WHERE Flat_ID = ?",
      [bill.Flat_ID]
    );
    const numPeople = billUsers.length;
    const userShareAmount = numPeople > 0 ? bill.Initial_Amount / numPeople : 0;

    // Get the user's existing payment
    const selectUserPaymentQuery = `SELECT  User_Amount_paid FROM user_payments WHERE User_ID = ? AND Bill_ID = ?`;
    const [userPaymentRows] = await db.query(selectUserPaymentQuery, [
      userId,
      bill_id,
    ]);
    let existingUserAmountPaid = 0;

    if (userPaymentRows.length > 0) {
      existingUserAmountPaid = parseFloat(userPaymentRows[0].User_Amount_paid);
    }

    const newUserAmountPaid = existingUserAmountPaid + amountPaid;

    // Update or insert the user's payment information
    if (userPaymentRows.length > 0) {
      await db.query(
        `UPDATE user_payments SET User_Amount_paid = ?, User_Payment_status = ? WHERE User_ID = ? AND Bill_ID = ?`,
        [
          newUserAmountPaid.toFixed(2),
          newUserAmountPaid >= userShareAmount ? "Paid" : "Not Paid",
          userId,
          bill_id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO user_payments (User_ID, Bill_ID, User_Amount_paid, User_Share_amount, User_Payment_status)
               VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          bill_id,
          amountPaid.toFixed(2),
          userShareAmount.toFixed(2),
          amountPaid >= userShareAmount ? "Paid" : "Not Paid",
        ]
      );
    }

    if (newAmountLeft === 0 && bill.Recurring && bill.Time_period) {
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
        0,
      ]);
    }
    if (newAmountLeft === 0) {
      await db.query(`DELETE FROM user_payments WHERE Bill_ID = ?`, [bill_id]);
      await db.query(`DELETE FROM Bills WHERE Bill_ID = ?`, [bill_id]);
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
    await db.query(`DELETE FROM user_payments WHERE Bill_ID = ?;`, [bill_id]);
    await db.query(`DELETE FROM Bills WHERE Bill_ID = ?;`, [bill_id]);
    return res.redirect("/bills");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error deleting bill.");
  }
});

router.post("/login/submit", async (req, res) => {
  const { email, pwd } = req.body;

  const db = pool.promise();
  const query = `SELECT User_ID, Flat_ID, Password FROM User WHERE Email = ? OR Username = ?`;

  try {
    const [rows] = await db.query(query, [email, email]);

    if (rows.length > 0) {
      const storedHash = rows[0].Password;
      const match = await bcrypt.compare(pwd, storedHash);

      if (match) {
        req.session.userId = rows[0].User_ID;

        if (rows[0].Flat_ID != null) {
          req.session.flat_Id = rows[0].Flat_ID;
          return res.redirect("/home");
        } else {
          return res.redirect("/joinGroup");
        }
      }
    }

    return res.status(401).render("login", {
      error: "Invalid email/username or password.",
      formData: { email }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).render("login", {
      error: "An unexpected error occurred. Please try again later.",
      formData: { email }
    });
  }
});


router.post("/signup/submit", async (req, res) => {
  const { Uname, email, pwd } = req.body;
  const db = pool.promise();

  try {
    const [rows] = await db.query(
      `SELECT Email, Username FROM User WHERE Email = ? OR Username = ?`,
      [email, Uname]
    );

    if (rows.length > 0) {
      let errorMessage = "";

      // Check if it's the email or username that already exists
      for (const row of rows) {
        if (row.Email === email) errorMessage += "Email already exists. ";
        if (row.Username === Uname) errorMessage += "Username already exists. ";
      }

      return res.render("signup", {
        error: errorMessage.trim(),
        formData: { Uname, email }
      });
    }

    const hashedPwd = await bcrypt.hash(pwd, 10);
    await db.query(
      `INSERT INTO User (Email, Username, Password) VALUES (?, ?, ?)`,
      [email, Uname, hashedPwd]
    );

    const [result] = await db.query(
      `SELECT User_ID FROM User WHERE Email = ?`,
      [email]
    );
    req.session.userId = result[0].User_ID;
    return res.redirect("/joinGroup");
  } catch (err) {
    console.error(err);
    return res.status(500).render("signup", {
      error: "An error occurred. Please try again later.",
      formData: { Uname, email }
    });
  }
});


router.post("/createGroup/create", async (req, res) => {
  const groupName = req.body.groupName;
  const groupID = await makeFlatID();

  const db = pool.promise();
  const status_query = `INSERT INTO Flat (Flat_ID, GroupName) VALUE (?, ?);`;
  try {
    const [rows] = await db.query(status_query, [groupID, groupName]);
  } catch (err) {
    console.error("You haven't set up the database yet!!" + err);
  }

  const dbb = pool.promise();
  const status_queryy = `UPDATE User SET Flat_ID = ? WHERE User_ID = ?;`;
  try {
    const [row] = await dbb.query(status_queryy, [groupID, req.session.userId]);
    req.session.flat_Id = groupID;
  } catch (err) {
    console.error("You haven't set up the database yet!!!" + err);
  }

  return res.redirect("/home");
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
        console.error("You haven't set up the database yet!!!" + err);
      }
    }
  } catch (err) {
    console.error("You haven't set up the database yet!!" + err);
  }

  return res.redirect("/home");
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
    console.error("You haven't set up the database yet!" + err);
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

/* Calendar / Events */
router.get("/calendar", async (req, res) => {
  if (!req.session.userId) {
    return res.render("signup", { error: null, formData: {} });
  } else if (!req.session.flat_Id) {
    return res.render("createGroup");
  }
  const db = pool.promise();
  const events_query = `
    SELECT Event_ID as id, Title as title, Description as description, Start_Time as start, End_Time as end
    FROM Events where Flat_ID = ?;
  `;
  const flat_query = `
    SELECT User_ID, Username FROM User WHERE Flat_ID = ?;
  `;
  const people_query = `
    SELECT Username 
    FROM Users_Events 
    INNER JOIN User on User.User_ID=Users_Events.User_ID 
    WHERE Event_ID=?;
  `;

  try {
    if (!req.session.flat_Id) {
      console.error("Flat ID is missing in session.");
      return res.status(400).send("Flat ID is missing.");
    }

    let [rows, fields] = await db.query(events_query, [req.session.flat_Id]);

    let events = rows;
    for (let i = 0; i < events.length; i++) {
      events[i].start = format(
        new Date(events[i].start),
        "yyyy-MM-dd HH:mm:SS"
      );
      events[i].end = format(new Date(events[i].end), "yyyy-MM-dd HH:mm:SS");

      [rows, fields] = await db.query(people_query, [events[i].id]);
      people = [];

      for (let j = 0; j < rows.length; j++) {
        people.push(rows[j].Username);
      }

      events[i].people = people;
    }

    [rows, fields] = await db.query(flat_query, [req.session.flat_Id]);
    let flatmates = rows

    res.status(200);
    res.render("calendar", { events: events, flatmates: flatmates });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Server error.");
  }
});

router.post("/calendar/addevent", async (req, res) => {
  const db = pool.promise();
  const event_stmt = `
    INSERT INTO Events(Flat_ID, Title, Description, Start_Time, End_Time)
    VALUES (?, ?, ?, ?, ?);
  `;
  const flat_stmt = `
    INSERT INTO Users_Events(User_ID, Event_ID)
    VALUES (?, ?);
  `;

  const flat_id = req.session.flat_Id;
  const title = req.body.title;
  const desc = req.body.desc;
  const start = format(new Date(req.body.start_time), "yyyy-MM-dd HH:mm:SS");
  const end = format(new Date(req.body.end_time), "yyyy-MM-dd HH:mm:SS");

  try {
    const [eventResult] = await db.query(event_stmt, [flat_id, title, desc, start, end]);
    const event_id = eventResult.insertId;

    for (let i = 0; i < req.body.flatmates.length; i++) {
      await db.query(flat_stmt, [req.body.flatmates[i], event_id]);
    };

    res.status(200);
    res.redirect("/calendar");
  } catch (err) {
    console.error("Error adding event:", err);
    console.log(err);
    res.status(500).send(`
      <script>
        window.location.href = '/calendar';
        alert('Error adding event, please try again.');
      </script>
    `);
  }
});

router.post("/calendar/:id/deleteevent", async (req, res) => {
  const db = pool.promise();
  const stmt = `
    DELETE FROM Users_Events WHERE Event_ID = ?;
    DELETE FROM Events WHERE Event_ID = ?;
  `;
  const id = req.params.id;

  try {
    await db.query(stmt, [id, id]);
    res.redirect("/calendar");
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).send(`
      <script>
        window.location.href = '/calendar';
        alert('Error deleting event, please try again.');
      </script>
    `);
  }
});

router.post("/calendar/editevent", async (req, res) => {
  const db = pool.promise();
  const event_stmt = `
    UPDATE Events 
    SET Title = ?, Description = ?, Start_Time = ?, End_Time = ?
    WHERE Event_ID = ?;
  `;
  const del_users_stmt = `
    DELETE FROM Users_Events WHERE Event_ID = ?;
  `;
  const add_users_stmt = `
    INSERT INTO Users_Events VALUES(?, ?);
  `;

  const id = req.body.id;
  const title = req.body.title;
  const desc = req.body.desc;
  const start = format(new Date(req.body.start_time), "yyyy-MM-dd HH:mm:SS");
  const end = format(new Date(req.body.end_time), "yyyy-MM-dd HH:mm:SS");
  const flatmates = req.body.flatmates;

  try {
    await db.query(event_stmt, [title, desc, start, end, id]);

    await db.query(del_users_stmt, [id]);
    for (let i = 0; i < flatmates.length; i++) {
      await db.query(add_users_stmt, [flatmates[i], id]);
    }

    res.status(200);
    res.redirect("/calendar");
  } catch (err) {
    console.error("Error editing event:", err);
    res.status(500).send(`
      <script>
        window.location.href = '/calendar';
        alert('Error editing event, please try again.');
      </script>
    `);
  }
});

router.post("/groceries/add", async (req, res) => {
  const { item, price, quantity } = req.body;
  const flatId = req.session.flat_Id;

  const db = pool.promise();
  const insertQuery = `
        INSERT INTO Groceries (Flat_ID, Item, Price, Quantity)
        VALUES (?, ?, ?, ?);
    `;
  try {
    await db.query(insertQuery, [flatId, item, price, quantity]);
    res.redirect("/groceries");
  } catch (err) {
    console.error("Error adding grocery item:", err);
    res.status(500).send("Error adding grocery item.");
  }
});

router.post("/groceries/update-quantity", async (req, res) => {
  const { flatId, item, quantity } = req.body;

  const db = pool.promise();
  const updateQuery = `
      UPDATE Groceries
      SET Quantity = ?
      WHERE Flat_ID = ? AND Item = ?
  `;

  try {
    await db.query(updateQuery, [quantity, flatId, item]);
    res.status(200).send("Quantity updated successfully");
  } catch (err) {
    console.error("Error updating quantity:", err);
    res.status(500).send("Error updating quantity.");
  }
});

router.post("/groceries/update-status", async (req, res) => {
  const { flatId, item, checked } = req.body;

  const db = pool.promise();
  const updateQuery = `
      UPDATE Groceries 
      SET Checked_State = ? 
      WHERE Flat_ID = ? AND Item = ?;
  `;

  try {
    await db.query(updateQuery, [checked, flatId, item]);
    res.status(200).send("Status updated");
  } catch (err) {
    console.error("Error updating grocery item status:", err);
    res.status(500).send("Error updating grocery item status.");
  }
});

router.post("/groceries/clear-checked", async (req, res) => {
  const clearCheckedQuery = `
  DELETE FROM Groceries WHERE Checked_State = 1;
`;

  try {
    await pool.promise().query(clearCheckedQuery);
    res.redirect("/groceries");
  } catch (error) {
    console.error("Error clearing checked items:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/groceries/clear-all", async (req, res) => {
  const flatId = req.session.flat_Id;

  const db = pool.promise();
  const deleteQuery = `
        DELETE FROM Groceries WHERE Flat_ID = ?;
    `;

  try {
    await db.query(deleteQuery, [flatId]);
    res.redirect("/groceries");
  } catch (err) {
    console.error("Error clearing all grocery items:", err);
    res.status(500).send("Error clearing all grocery items.");
  }
});

module.exports = router;

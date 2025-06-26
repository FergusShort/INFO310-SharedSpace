//imports mysql2
const mysql2 = require('mysql2');

//creates connection to database
const pool = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',   //connects to host
    user: process.env.DB_USER || 'sharedspace',     //use these credentials (Not really needed as included in the yml but better safe then sorry :)
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'SharedSpace',
    charset: 'utf8mb4', //what characters to use
    waitForConnections: false,  //throws an error if it can't make a connections
    connectionLimit: 10,    //10 simultaneous connects
    queueLimit: 0,  //no limit on how many querries can be queued waiting for connection
    multipleStatements: true //can execute multiple statements
});

//error handling
pool.on('error', (err) => {
    console.error('Error with the database connection pool', err);
});

// Make a pool available to other files (path_router in our case) so we can query the databse
module.exports = pool;

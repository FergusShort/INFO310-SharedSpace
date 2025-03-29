const express = require('express');
const fileUpload = require('express-fileupload');
const pool = require('./db');
const path = require('path');

router = express.Router();

router.use(express.urlencoded({ extended: true }));
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

router.get('/signup', async (req, res) => {
    res.render('signup');
});

router.get('/login', async (req, res) => {
    res.render('login');
});

router.get('/groceries', async (req, res) => {
    res.render('groceries');
});

module.exports = router;

const express = require('express');
const fileUpload = require('express-fileupload');
const pool = require('./db');
const path = require('path');
router = express.Router();

router.use(express.urlencoded({ extended: true }));
router.use(fileUpload());
router.use(express.static('public'));

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

    res.render('groceries'); //change later when homepage is created
});

router.get('/groceries', async (req, res) => {
    res.render('groceries');
});

module.exports = router;

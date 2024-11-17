const User = require('../models/User');
const mongoose = require('mongoose');


exports.addUser = async(req , res) =>
{
    const {email , password} = req.body.

    if(!email , !password)
    {
        console.log('Please Enter the Email and Password');
    }

    try{
        const newUser = new User({
            email,
            password
        });

        const saveUser = await newUser.save();
    }
    catch(error)
    {
        console.error("Error in Creating User" , error.message)
    }
}
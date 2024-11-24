require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const createUser = async (req, res) => {
  const existedUser = await User.findOne({ email: req.body.email });
  if (existedUser === null && req.body.isGuest === true) {
    // CONDITION FOR CREATING AN ACCOUNT AS A GUEST
    const { first_name, last_name, email, phone } = req.body;
    try {
      const user = await User.create({
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone: phone,
        isGuest: true,
      });
      return res.status(200).json({message: "Guest account created", user: user});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else if (existedUser !== null && existedUser.isGuest === true) {
    // CONDITION FOR SENDING THE LINK TO SET PASSWORD
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const link = `http://localhost:3000/setPassword?resetToken=${token}`;

      let mailOptions = {
        from: process.env.GMAIL, // Sender's email address
        to: existedUser.email, // Recipient's email address
        subject: "Set your password!", // Email subject
        html: `<p>Click the link below to access:</p><a href="${link}">${link}</a>`, // HTML formatted message
      };

      await transporter.sendMail(mailOptions);

      existedUser.passwordResetToken = token;
      existedUser.passwordResetExpiry = Date.now() + 3600000;
      await existedUser.save();

      res.status(200).json({
        message:
          "Account already exist with this gmail. Check your email!",
      });
    } catch (error) {
      res.status(500).json({ error: err.message });
    }
  } else if (existedUser !== null && existedUser.isGuest === false) {
    // CONDITION WHEN A USER IS LOGOUT AND TRIES TO PLACE AN ORDER
    return res.status(200).json({message: "Account already exist with this email", user: existedUser});
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const { first_name, last_name, email, phone } = req.body;
    try {
      const user = await User.create({
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashedPassword,
        phone: phone,
      });
      return res.status(200).json({message: "Account created", user: user});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (user === null) {
    return res.status(404).json({ error: "User does not exist" });
  }
  const userPayload = { id: user._id, email: user.email };
  try {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET);
      const userData = { token: token, user: user, message: "Logged In" };
      return res.status(200).json(userData);
    } else {
      return res.status(500).json({ error: "Incorrect Password" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const existedUser = await User.findOne({
      passwordResetToken: req.body.token,
      passwordResetExpiry: { $gt: Date.now() },
    });
    if (!existedUser) {
      return res.status(400).send("Token is invalid or has expired");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    existedUser.isGuest = false;
    existedUser.password = hashedPassword;
    existedUser.passwordResetToken = undefined
    existedUser.passwordResetExpiry = undefined
    await existedUser.save();
    res.status(200).json({ message: "Password set!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const addAddress = async(req, res) => {
  const {userId, address, city} = req.body
  try {
    const user = await User.findOne({_id: userId})
    user.address = address
    user.city = city
    await user.save()
    return res.status(200).json({message: "Address updated", userAddress: {address: user.address, city: user.city}})
  } catch(err){ 
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createUser, loginUser, resetPassword, addAddress };

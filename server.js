require('dotenv').config();

const path = require('path')
const fs = require('fs')
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

// APP INSTANCE
const app = express();

// ROUTER 
const productRoutes = require('./routes/productRoutes')
const userRoutes = require('./routes/userRoutes')
const orderRoutes = require('./routes/orderRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const parentCategoryRoutes = require('./routes/parentCategoryRoutes')

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
// app.use(express.urlencoded({ extended: true }));

// TO USE THE IMAGES SAVED IN MONGODB WITH THE BACKEND RELATIVE PATH
// app.use('/images', express.static((path.join(backendPath,`images/${category}/${productName}`))));
// app.use('/images', express.static('D:/Project Files/MERN-Perfume-Store/Backend/images'));

// PRODUCT ROUTES
app.use('/', productRoutes)

// USER ROUTES
app.use('/', userRoutes)

// ORDER ROUTES
app.use('/', orderRoutes)

// CATEGORY ROUTES
app.use('/', categoryRoutes)

// PARENT CATEGORY ROUTES
app.use('/', parentCategoryRoutes)

// DATABASE CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('Listening to PORT 4000 and connected to database');
    });
  })
  .catch((err) => {
    console.log(err);
  });

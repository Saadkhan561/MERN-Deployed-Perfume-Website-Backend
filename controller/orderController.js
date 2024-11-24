const Order = require("../models/orderModel");
const User = require("../models/userModel")
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");

const placeOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    //update quantity of products after placing order
    // for (const item of order.products) {
    //   await Products.updateOne(
    //     { _id: item.product._id },
    //     { $inc: { quantityAvailable: -item.quantity } }
    //   );
    // }
    res
      .status(200)
      .json({ message: "Your order has been placed", order: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  //update quantity of products after placing order
};

const updateOrder = async (req, res) => {
  //update quantity of products after placing order
};

const getOrders = async (req, res) => {
  const { searchTerm, skip = 0, limit = 5 } = req.query;

  const pipeline = [
    {
      $lookup: {
        from: "perfume_users",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "perfume_products",
        localField: "products.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: "$_id",
        customerDetails: { $first: "$customerDetails" },
        totalAmount: { $first: "$totalAmount" },
        discount: { $first: "$discount" },
        orderStatus: { $first: "$orderStatus" },
        shippingAddress: { $first: "$shippingAddress" },
        products: {
          $push: {
            product: "$productDetails.name",
            quantity: "$products.quantity",
            option: "$products.option",
            price: "$products.price",
          },
        },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];
  try {
    if (searchTerm) {
      const orderId = ObjectId.createFromHexString(searchTerm);
      pipeline.push({
        $match: {
          _id: orderId,
        },
      });

      const totalPipeline = [...pipeline];
      totalPipeline.push({
        $count: "orders",
      });

      const totalCountResult = await Order.aggregate(totalPipeline);

      const totalOrders =
        totalCountResult.length > 0 ? totalCountResult[0].orders : 0;

      const totalPages = Math.ceil(totalOrders / limit);

      pipeline.push({ $skip: parseInt(skip) });
      pipeline.push({ $limit: parseInt(limit) });

      const orders = await Order.aggregate(pipeline);
      if (orders.length === 0) {
        return res.json({ message: "No order found..." });
      }

      return res.status(200).json({
        orders,
        totalOrders,
        totalPages,
        currentPage: Math.ceil(skip / limit) + 1,
      });
    }
    const totalPipeline = [...pipeline];
    totalPipeline.push({
      $count: "orders",
    });

    const totalCountResult = await Order.aggregate(totalPipeline);

    const totalOrders =
      totalCountResult.length > 0 ? totalCountResult[0].orders : 0;

    const totalPages = Math.ceil(totalOrders / limit);

    pipeline.push({ $skip: parseInt(skip) });
    pipeline.push({ $limit: parseInt(limit) });

    const orders = await Order.aggregate(pipeline);
    if (orders.length === 0) {
      return res.json({ message: "No orders are placed yet..." });
    }

    return res.status(200).json({
      orders,
      totalOrders,
      totalPages,
      currentPage: Math.ceil(skip / limit) + 1,
    });
  } catch (err) {
    return res.json(err);
  }
};

const getUserOrders = async (req, res) => {
  const { userId, limit } = req.query;
  const id = ObjectId.createFromHexString(userId);
  const limitInt = parseInt(limit, 10);

  const pipeline = [
    {
      $match: {
        customer: id,
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  if (limitInt) {
    pipeline.push({ $limit: limitInt });
  }
  try {
    const orderCount = await Order.find({ customer: id });
    const orders = await Order.aggregate(pipeline);
    if (orders.length <= 0) {
      return res.json({ message: "You have no orders..." });
    }
    if (orders.length < orderCount.length) {
      return res.json({ message: "Orders", orders: orders, load: true });
    } else {
      return res.json({ message: "Orders", orders: orders });
    }
  } catch (err) {
    return res.json(err);
  }
};

//change order Status and verify user on email/number
const changeOrderStatus = async (req, res) => {
  const { id, orderStatus } = req.body;
  try {
    await Order.updateOne({ _id: id }, { $set: { orderStatus: orderStatus } });
    return res.status(200).json({ message: "Updated" });
  } catch (err) {
    return res.json(err);
  }
};

const getUserOrderById = async (req, res) => {
  const orderId = ObjectId.createFromHexString(req.query.orderId);

  const pipeline = [
    {
      $match: { _id: orderId },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "perfume_products",
        localField: "products.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $lookup: {
        from: "perfume_categories",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: "$categoryDetails",
    },
    {
      $group: {
        _id: "$_id",
        products: {
          $push: {
            product_id: "$productDetails._id",
            name: "$productDetails.name",
            category: "$productDetails.category",
            category_name: "$categoryDetails.name",
            quantity: "$products.quantity",
            option: "$products.option",
            price: "$products.price",
          },
        },
        customer: { $first: "$customer" },
        totalAmount: { $first: "$totalAmount" },
        discount: { $first: "$discount" },
        orderStatus: { $first: "$orderStatus" },
        shippingAddress: { $first: "$shippingAddress" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
  ];

  try {
    const order = await Order.aggregate(pipeline);
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json(err);
  }
};

const sendEmail = async (req, res) => {
  const { customerId, subject,trackingId } = req.body;
  const id = ObjectId.createFromHexString(customerId)
  try {
    const user = await User.findOne({_id: id})
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.GMAIL,
      to: user?.email,
      subject: subject,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tracking Information</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #333;">${subject}</h2>
          <p>Dear Customer,</p>
          <p>Thank you for choosing us! Your order has been processed and is on its way.</p>
          <p>To keep you informed, here is your tracking information:</p>
          <p><strong>Tracking ID:</strong> <span style="color: #0073e6;">${trackingId}</span></p>
          <p>You can use this tracking ID to monitor the status of your package on our website or through our shipping partner’s tracking page.</p>
          <p>If you have any questions or need further assistance, feel free to reply to this email.</p>
          <p style="margin-top: 30px;">Best regards,</p>
          <p>
            <strong>Perfume Shop</strong><br>
            03237092577<br>
            <a href="mailto:support@yourcompany.com" style="color: #0073e6;">support@yourcompany.com</a>
          </p>
        </div>
      </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: `Email sent to ${user.email}` });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  placeOrder,
  cancelOrder,
  updateOrder,
  getOrders,
  getUserOrders,
  changeOrderStatus,
  getUserOrderById,
  sendEmail
};

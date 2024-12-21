const { ObjectId } = require("mongodb");
const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");

const path = require("path");
const fs = require("fs");

//get pinned product first
const getAllProducts = async (req, res) => {
  let { categoryId, skip = 0, limit = 10 } = req.query;

  try {
    skip = parseInt(skip, 10);
    limit = parseInt(limit, 10);

    if (categoryId === "null" || categoryId === "") {
      categoryId = null;
    } else {
      try {
        categoryId = ObjectId.createFromHexString(categoryId);
      } catch (error) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    // Base pipeline
    const basePipeline = [
      {
        $match: {
          productStatus: true,
          ...(categoryId && { category: categoryId }),
        },
      },
      {
        $lookup: {
          from: "perfume_categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $sort: {
          pinned: -1,
          createdAt: -1,
        },
      },
    ];

    // Total count pipeline
    const countPipeline = [...basePipeline, { $count: "totalProducts" }];
    const countResult = await Products.aggregate(countPipeline);
    const totalProducts =
      countResult.length > 0 ? countResult[0].totalProducts : 0;

    // Pagination logic
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = Math.ceil(skip / limit) + 1;

    // Add pagination stages to the pipeline
    const productPipeline = [
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
    ];

    if (categoryId) {
      productPipeline.push({
        $group: {
          _id: "$categoryDetails._id",
          category_name: { $first: "$categoryDetails.name" },
          products: { $push: "$$ROOT" },
        },
      });
    }

    const products = await Products.aggregate(productPipeline);

    // Handle empty products
    if (products.length === 0) {
      return res
        .status(200)
        .json({ message: "No products for this category...", products: [] });
    }

    return res.status(200).json({
      products,
      totalProducts,
      totalPages,
      currentPage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// FOR FETCHING NON FILTERED PRODUCTS
const getProducts = async (req, res) => {
  const { category, skip = 0, searchTerm, limit = 2 } = req.query;
  const pipeline = [
    {
      $lookup: {
        from: "perfume_categories",
        localField: "category",
        foreignField: "_id",
        as: "category_details",
      },
    },
    {
      $unwind: "$category_details",
    },
  ];
  if (category) {
    pipeline.push({
      $match: {
        "category_details.name": category,
      },
    });
  }

  try {
    if (searchTerm) {
      const queryWords = searchTerm.split(" ").filter((word) => word);
      const regexWords = queryWords.map((word) => new RegExp(word));
      pipeline.push({
        $match: {
          $or: regexWords.map((word) => ({
            $or: [{ name: { $regex: word, $options: "i" } }],
          })),
        },
      });
      const totalPipeline = [...pipeline];

      totalPipeline.push({
        $count: "totalProducts",
      });

      const totalCountResult = await Products.aggregate(totalPipeline);
      const totalProducts =
        totalCountResult.length > 0 ? totalCountResult[0].totalProducts : 0;
      const totalPages = Math.ceil(totalProducts / limit);

      pipeline.push({ $skip: parseInt(skip) });
      pipeline.push({ $limit: parseInt(limit) });

      const products = await Products.aggregate(pipeline);

      return res.status(200).json({
        products,
        totalProducts,
        totalPages,
        currentPage: Math.ceil(skip / limit) + 1,
      });
    }

    const totalPipeline = [...pipeline];

    totalPipeline.push({
      $count: "totalProducts",
    });

    const totalCountResult = await Products.aggregate(totalPipeline);

    const totalProducts =
      totalCountResult.length > 0 ? totalCountResult[0].totalProducts : 0;

    const totalPages = Math.ceil(totalProducts / limit);

    pipeline.push({ $skip: parseInt(skip) });
    pipeline.push({ $limit: parseInt(limit) });

    const products = await Products.aggregate(pipeline);
    res.status(200).json({
      products,
      totalProducts,
      totalPages,
      currentPage: Math.ceil(skip / limit) + 1,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const trendingProducts = async (req, res) => {
  try {
    const ordersExist = await Order.find();
    if (ordersExist.length === 0) {
      return res.status(200).json({ message: "No Trending Products" });
    }

    const order = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          order_count: { $sum: 1 },
          total_quantity_sold: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "perfume_products",
          localField: "_id",
          foreignField: "_id",
          as: "product_info",
        },
      },
      { $unwind: "$product_info" },
      {
        $match: { "product_info.productStatus": true },
      },
      {
        $lookup: {
          from: "perfume_categories",
          localField: "product_info.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $lookup: {
          from: "perfume_parent_categories",
          localField: "categoryDetails.parentCategory",
          foreignField: "_id",
          as: "parentCategoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $unwind: "$parentCategoryDetails",
      },
      {
        $addFields: {
          "categoryDetails.parentCategoryDetails": "$parentCategoryDetails",
        },
      },
      {
        $project: {
          _id: 1,
          order_count: 1,
          total_quantity_sold: 1,
          categoryDetails: 1,
          parentCategoryDetails: 1,
          name: "$product_info.name",
          description: "$product_info.description",
          price: "$product_info.price",
          brand: "$product_info.brand",
          options: "$product_info.options",
          imagePaths: "$product_info.imagePaths",
          discount: "$product_info.discount",
        },
      },
      { $sort: { order_count: -1 } },
      { $limit: 5 },
    ]);

    return res.status(200).json(order);
  } catch (err) {
    return res.json(err);
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  const productId = ObjectId.createFromHexString(id);

  if (!productId) {
    throw new Error("Invalid Product ID");
  }
  const product = await Products.aggregate([
    { $match: { _id: productId } },
    {
      $lookup: {
        from: "perfume_categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
  ]);
  // const imageUrls = product.imagePaths.map(path => `/images/${path.split('/').pop()}`);
  // console.log(imageUrls);
  // const imageUrls = product.imagePaths.map(path => `${req.protocol}://${req.get('host')}/images/${path.split('/').pop()}`);
  if (!product) {
    res.json("No Product Found");
  } else {
    return res.json(product[0]);
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const products = Products.aggregate([
      {
        $lookup: {
          from: "Category",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $match: {
          productStatus: true,
          categoryDetails: req.params.id,
        },
      },
      {
        $sort: {
          pinned: -1, //which means true (1) comes first
        },
      },
      {
        $project: {
          name: 1,
          brand: 1,
          description: 1,
          category: "$categoryDetails.name",
          quantityAvailable: 1,
          price: 1,
          discount: 1,
          pinned: 1,
          imagePaths: 1,
        },
      },
    ]);

    if (products.length > 0) {
      return res.status(200).json(products);
      // const productsWithImages = products.map(product => ({
      //   ...product.toObject(),
      //   imageUrls: product.imagePaths.map(path => `/images/${product.category}/${file.originalname}`)
      //   // imageUrls: product.imagePaths.map(path => `${req.protocol}://${req.get('host')}/uploads/${path.split('/').pop()}`)
      // }));
      // return res.json(productsWithImages);
    } else {
      return res.json("No Product Found");
    }
  } catch (err) {
    return res.json(err);
  }
};

const getProductImages = async (req, res) => {
  const backendPath = path.join(__dirname, "..");
  const { parentCategory, category, productName } = req.params;
  const productImageDir = path.join(
    backendPath,
    "images",
    parentCategory,
    category,
    productName
  );

  if (fs.existsSync(productImageDir)) {
    fs.readdir(productImageDir, (err, files) => {
      if (err) {
        console.error("Directory read error:", err);
        return res
          .status(500)
          .json({ message: "Unable to read the directory" });
      }

      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );

      if (imageFiles.length === 0) {
        return res
          .status(404)
          .json({ message: "No images found for this product" });
      }

      try {
        const imagePaths = imageFiles.map((file) =>
          path.join(productImageDir, file)
        );
        const images = imagePaths.map((imagePath) =>
          fs.readFileSync(imagePath).toString("base64")
        );
        res.json(images);
      } catch (fileErr) {
        console.error("File read error:", fileErr);
        res.status(500).json({ message: "Error reading image files" });
      }
    });
  } else {
    console.error("Product folder not found:", productImageDir);
    res.status(404).json({ message: "Product folder not found" });
  }
};

const postProduct = async (req, res) => {
  const category = await Category.findOne({ name: req.body.category });
  console.log(typeof JSON.parse(req.body.options));
  const options = JSON.parse(req.body.options);
  try {
    const { name, description, brand } = req.body;
    const imagePaths = req.files.map(
      (file) => `${category}/${file.originalname}`
    );

    const product = new Products({
      name,
      description,
      brand,
      category: category._id,
      options,
      imagePaths,
    });

    await product.save();
    res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error });
  }
};

const editProduct = async (req, res) => {
  const { id, option, price, quantity, discount, status, productStatus } =
    req.body;
  const productId = ObjectId.createFromHexString(id);

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await Products.updateOne(
      { _id: productId },
      {
        $set: {
          [`options.${option}.quantityAvailable`]: quantity,
          [`options.${option}.discount`]: discount,
          [`options.${option}.price`]: price,
          pinned: status,
          productStatus: productStatus,
        },
      }
    );
    return res.status(200).json({ message: "Updated" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  //complete
};

// SEARCH A PRODUCT
const searchResults = async (req, res) => {
  const query = req.query.q;
  try {
    const words = query.split(" ").filter((word) => word);
    const regexWords = words.map((word) => new RegExp(word));

    // const searchCategory = await Category.find({
    //   $or: regexWords.map((word) => ({ name: word })),
    // });
    // let products = [];
    // if (searchCategory.length > 0) {
    //   const categoryId = searchCategory.map((cat) => cat._id);
    //   products = await Products.aggregate([
    //     {
    //       $match: { category: { $in: categoryId }, productStatus: true },
    //     },
    //     {
    //       $lookup: {
    //         from: "perfume_categories",
    //         localField: "category",
    //         foreignField: "_id",
    //         as: "categoryDetails",
    //       },
    //     },
    //     {
    //       $unwind: "$categoryDetails",
    //     },
    //     {
    //       $project: {
    //         _id: 1,
    //         name: 1,
    //         description: 1,
    //         brand: 1,
    //         price: 1,
    //         imagePaths: 1,
    //         discount: 1,
    //         "categoryDetails.name": 1,
    //       },
    //     },
    //   ]);
    // } else {
    //   products = await Products.aggregate([
    //     {
    //       $match: {
    //         $or: regexWords.map((word) => ({
    //           $or: [
    //             { name: { $regex: word, $options: "i" } },
    //             { description: { $regex: word, $options: "i" } },
    //             { brand: { $regex: word, $options: "i" } },
    //           ],
    //         })),
    //         productStatus: true,
    //       },
    //     },
    //     {
    //       $lookup: {
    //         from: "perfume_categories",
    //         localField: "category",
    //         foreignField: "_id",
    //         as: "categoryDetails",
    //       },
    //     },
    //     {
    //       $unwind: "$categoryDetails",
    //     },
    //     {
    //       $project: {
    //         _id: 1,
    //         name: 1,
    //         description: 1,
    //         brand: 1,
    //         price: 1,
    //         imagePaths: 1,
    //         discount: 1,
    //         "categoryDetails.name": 1,
    //       },
    //     },
    //   ]);
    // }
    const products = await Products.aggregate([
      {
        $match: {
          $or: regexWords.map((word) => ({
            $or: [
              { name: { $regex: word, $options: "i" } },
              { description: { $regex: word, $options: "i" } },
              { brand: { $regex: word, $options: "i" } },
            ],
          })),
          productStatus: true,
        },
      },
      {
        $lookup: {
          from: "perfume_categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          brand: 1,
          price: 1,
          imagePaths: 1,
          discount: 1,
          options: 1,
          "categoryDetails.name": 1,
        },
      },
    ]);
    if (products.length === 0) {
      res.status(404).json({ msg: "No results found..." });
    } else {
      res.status(200).json(products);
    }
  } catch (err) {
    res.status(500).json({ msg: "Error fetching products..." });
  }
};

module.exports = {
  getAllProducts,
  getProducts,
  postProduct,
  getProductById,
  getProductsByCategory,
  getProductImages,
  searchResults,
  trendingProducts,
  updateProduct,
  editProduct,
};

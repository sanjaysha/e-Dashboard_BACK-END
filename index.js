const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/signup", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (error, token) => {
    if (error) {
      res.send({ result: "Something went wrong!" });
    } else {
      res.send({ result, auth: token });
    }
  });
});

app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (error, token) => {
        if (error) {
          res.send({ result: "Something went wrong!" });
        } else {
          res.send({ user, auth: token });
        }
      });
    } else {
      res.send({ result: "Enter Correct Email and Password!" });
    }
  } else {
    if (req.body.password && !req.body.email) {
      res.send({ result: "Enter Email" });
    } else res.send({ result: "Enter Password" });
  }
});

app.post("/add-product", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

app.get("/products", verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No Products Found!" });
  }
});

app.delete("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No record found!" });
  }
});

app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      {
        name: { $regex: req.params.key },
      },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    Jwt.verify(token, jwtKey, (error, valid) => {
      if (error) {
        res.status(401).send({ result: "Please provid valid token" });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "Please send token with header" });
  }
}

app.listen(5000);

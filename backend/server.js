const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./userModel");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const cors = require("cors");
const app = express();

dotenv.config();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("My server");
});

const generateToken = (name) => {
  return jwt.sign({ name }, process.env.JWt_SECRET, { expiresIn: "1h" });
};

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB connection successful");
  } catch (error) {
    console.log("DB Connection Failed" + error);
  }
};

connectDB();

app.post("/", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }

    const user = await User.findOne({ email });

    if (user) {
      const token = generateToken(username);
      const verifiedToken = jwt.verify(token, process.env.JWt_SECRET);
      res.status(200).json({
        message: "Logged in",
        user: verifiedToken.user,
        token,
      });
    } else {
      // If user doesn't exist, create a new user, generate a token, and send it as a response
      const token = generateToken(username);

      const newUser = await User.create({
        username,
        email,
      });

      const cookieOptions = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };

      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", token, cookieOptions)
      );

      res.status(201).json({
        message: "Account created and logged in",
        user: newUser,
        token,
      });
    }
  } catch (error) {
    console.log("Error 💥💥", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at port: ${port}`);
});

const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const blacklistTokenModel = require("../models/blacklist.model");

async function registerUserController(req, res) {
  const { username, email, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const isUserAlreadyExist = await userModel.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (isUserAlreadyExist) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: hash,
  });

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", token);
  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

async function loginUserController(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await userModel.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  )

  res.cookie("token", token);
    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}

async function logoutUserController(req, res) {
    const token = req.cookies.token

    if(token){
        await blacklistTokenModel.create({token})
    }

    res.clearCookie("token")
    res.status(200).json({message: "User logged out successfully"})
}

async function getMeController(req,res){
    const user = await userModel.findById(req.user.id)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
        message:"User details fetched successfully", 
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }

    })
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController };

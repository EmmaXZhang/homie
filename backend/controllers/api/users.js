/* eslint-disable no-undef */
const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//AuthorisedUser
//POST /api/users/login
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      //generate Token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "60d",
      });

      // set jwt as HTTP only cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 60 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "internal server error" });
  }
}

// Logout user / clear cookie
// POST /api/users/logout
function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logged out successfully" });
}

// RegisterUser
// POST /api/users
async function create(req, res) {
  try {
    //The create() function is to handle the creation of a new user.
    const user = await User.create(req.body);
    const token = createJWT(user);

    // Return user information and token in the response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (err) {
    res.status(400).json(err);
  }
}

// getUser Profile
// GET /api/users/profile
async function getUserProfile(req, res) {
  console.log("req.user", req.user);
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
}

// update User profile
// PUT /api/users/profile
async function updateUserProfile(req, res) {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
}

// Admin----------------------
//Get all users
//GET /api/users
async function getUsers(req, res) {
  const users = await User.find({});
  res.json(users);
}

//Delete user
//DELETE /api/users/:id
async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("Can not delete admin user");
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
}

// Get user by ID
// GET /api/users/:id
async function getUserById(req, res) {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
}

//Update user
//PUT /api/users/:id
async function updateUser(req, res) {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
}

//helper function
function createJWT(userData) {
  //sign (in jsonwebtoken library) -> create JWTs
  const syncToken = jwt.sign(
    // data payload
    { user: userData },
    process.env.SECRET,
    { expiresIn: "24h" }
  );
  console.log("syncToken", syncToken);
  return syncToken;
}

function checkToken(req, res) {
  // req.user will always be there for you when a token is sent
  console.log("req.user", req.user);
  res.json(req.exp);
}

module.exports = {
  login,
  logout,
  create,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  updateUser,
  getUserById,
  checkToken,
};

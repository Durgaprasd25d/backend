const express = require("express");
const {
  sendFriendRequest,
  getPendingRequests,
  respondToFriendRequest,
  findFriend,
  getUserProfile,
  getUserProfileByUsername,
  getAllFriends,
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes for friend requests
router.post("/send", protect, sendFriendRequest); // Send friend request
router.get("/pending", protect, getPendingRequests); // Get pending friend requests
router.post("/respond", protect, respondToFriendRequest); // Accept or reject friend request

router.get("/search", protect, findFriend); // search users by username
router.get("/all", protect, getAllFriends); //get all friends
router.get("/profile", protect, getUserProfile); // Get user profile
router.get("/recepient-profile/:username", getUserProfileByUsername); // user's profile by username

module.exports = { router };

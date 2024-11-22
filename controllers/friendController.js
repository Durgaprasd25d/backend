const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// Send a Friend Request
exports.sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    const existingRequest = await FriendRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
    });
    if (existingRequest)
      return res.status(400).json({ message: "Friend request already sent" });

    const friendRequest = await FriendRequest.create({
      sender: req.user.id,
      receiver: receiverId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: "Error sending friend request", error });
  }
};

// Get Pending Friend Requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    })
      .populate("sender", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending requests", error });
  }
};

// Accept or Reject a Friend Request
exports.respondToFriendRequest = async (req, res) => {
  const { requestId, action } = req.body; // action: "accept" or "reject"

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest)
      return res.status(404).json({ message: "Request not found" });

    if (friendRequest.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized action" });

    friendRequest.status = action === "accept" ? "accepted" : "rejected";
    await friendRequest.save();

    if (action === "accept") {
      const sender = await User.findById(friendRequest.sender);
      const receiver = await User.findById(friendRequest.receiver);

      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);

      await sender.save();
      await receiver.save();
    }

    res.status(200).json(friendRequest);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error responding to friend request", error });
  }
};

// Search users by username
exports.findFriend = async (req, res) => {
  try {
    const { username } = req.query; // Get the username query from the request

    // If no username is provided or it's empty, return a 400 error
    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username query is required" });
    }

    // Search for users whose username matches the query (case-insensitive)
    const users = await User.find({
      username: { $regex: username, $options: "i" }, // Case-insensitive search
    });

    // If no users are found, return a 404 error
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Return the list of users matching the query
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Get user ID from the decoded JWT (using middleware to verify token)
    const userId = req.user.id;

    // Fetch the user from the database by user ID
    const user = await User.findById(userId).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the user profile data (username, email, etc.)
    res.status(200).json({
      username: user.username,
      email: user.email,
      friends: user.friends,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params; // Get username from route params

    // Search for the user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: username, $options: "i" },
    }).select("-password"); // Exclude the password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user profile data including the id
    res.status(200).json({
      _id: user._id, // Include the user ID
      username: user.username,
      email: user.email,
      friends: user.friends,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the logged-in user and populate their friends
    const user = await User.findById(userId).populate("friends", "username email onlineStatus");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Separate online and offline friends
    const onlineFriends = user.friends.filter(friend => friend.onlineStatus === true);
    const offlineFriends = user.friends.filter(friend => friend.onlineStatus !== true);

    // Sort offline friends alphabetically by username
    offlineFriends.sort((a, b) => a.username.localeCompare(b.username));

    res.status(200).json({
      onlineFriends,
      offlineFriends,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error" });
  }
};
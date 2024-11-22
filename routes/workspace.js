const express = require("express");
const router = express.Router();
const {
  createWorkspace,
  getWorkspaces,
  inviteToWorkspace,
  startLiveSession,
  getWorkspaceById,
  saveWorkSpace,
} = require("../controllers/workspaceContoller");
const { protect } = require("../middleware/authMiddleware");

// Secure all routes with the protect middleware
router.use(protect);

// Routes
router.post("/", createWorkspace); // Create workspace
router.get("/", getWorkspaces); // Get all workspaces for logged-in user
router.get("/:id", getWorkspaceById); // Get  workspace by id
router.post("/:id/save", saveWorkSpace);
router.post("/invite", inviteToWorkspace); // Invite a friend to a workspace
router.post("/live", startLiveSession); // Start a live session

module.exports = router;

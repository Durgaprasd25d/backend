const Workspace = require("../models/Workspace");
const User = require("../models/User");

// Create a new workspace
exports.createWorkspace = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Workspace name is required" });
  }

  try {
    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create workspace", error });
  }
};

// Get all workspaces for the logged-in user
exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      members: req.user._id,
    }).populate("owner", "username email");

    res.status(200).json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces", error });
  }
};
// Get workspace by ID
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "username email")
      .populate("members", "username email");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.status(200).json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        owner: workspace.owner,
        members: workspace.members,
        notepadContent: workspace.notepadContent || "",
        isLive: workspace.isLive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspace", error });
  }
};

// Save notepad content in a workspace
exports.saveWorkSpace = async (req, res) => {
  const { notepadContent } = req.body;

  if (!notepadContent) {
    return res.status(400).json({ message: "Notepad content is required" });
  }

  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    workspace.notepadContent = notepadContent;
    await workspace.save();

    res.status(200).json({
      success: true,
      message: "Notepad content saved successfully",
      notepadContent: workspace.notepadContent,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save notepad content", error });
  }
};

// Invite a friend to the workspace
exports.inviteToWorkspace = async (req, res) => {
  const { workspaceId, friendId } = req.body;

  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!workspace.members.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    if (workspace.members.includes(friendId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    workspace.members.push(friendId);
    await workspace.save();

    res.status(200).json({ message: "User added to workspace", workspace });
  } catch (error) {
    res.status(500).json({ message: "Failed to add user to workspace", error });
  }
};

exports.startLiveSession = async (req, res) => {
  const { workspaceId } = req.body;
  console.log("Received workspaceId:", workspaceId);

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      console.log("Workspace not found");
      return res.status(404).json({ message: "Workspace not found" });
    }

    console.log("Workspace found:", workspace);

    if (workspace.owner.toString() !== req.user._id.toString()) {
      console.log("User is not the owner:", req.user._id);
      return res
        .status(403)
        .json({ message: "Only the owner can start a live session" });
    }

    workspace.isLive = true;
    await workspace.save();

    const io = req.app.get("io");
    if (!io) {
      console.log("Socket.io instance not found");
      return res.status(500).json({ message: "Socket.io instance missing" });
    }

    io.emit("workspace-live", workspaceId);
    res.status(200).json({ message: "Live session started", workspace });
  } catch (error) {
    console.error("Error in starting live session:", error);
    res.status(500).json({ message: "Failed to start live session", error });
  }
};

const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notepadContent: { type: String, default: "" }, // New field to store notepad content
    isLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Workspace", workspaceSchema);

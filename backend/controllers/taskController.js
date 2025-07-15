const Task = require("../models/Task");
const User = require("../models/User");
const Log = require("../models/ActionLog");
const { getIO } = require("../socket");

const columnNames = ["Todo", "In Progress", "Done"];

exports.createTask = async (req, res) => {
  try {
    const { title, description, board, priority, username, assignedTo } =
      req.body;

    // Only enforce assignedTo if not planning to smart assign
    if (assignedTo === undefined) {
      return res.status(400).json({ error: "Task must be assigned to a user" });
    }

    if (columnNames.includes(title)) {
      return res.status(400).json({ error: "Title cannot match column name" });
    }

    const existing = await Task.findOne({ title, board });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Title already exists on this board" });
    }

    console.log("Trying to assign task to:", assignedTo);

    // Try finding user by email or username (in case emails are stored in `username`)
    const userDoc = await User.findOne({
      $or: [{ email: assignedTo }, { username: assignedTo }],
    });

    if (!userDoc) {
      console.error("Assigned user not found for:", assignedTo);
      return res.status(400).json({ error: "Assigned user not found" });
    }

    const task = await Task.create({
      title,
      description,
      board,
      priority,
      assignedTo: userDoc._id,
      status: "Todo",
      lastModifiedBy: username,
      lastModifiedAt: new Date(),
    });

    await Log.create({
      taskId: task._id,
      user: username,
      action: "Created task",
      timestamp: new Date(),
    });

    const populatedTask = await Task.findById(task._id).populate(
      "assignedTo",
      "username email"
    );

    getIO().emit("taskUpdate", { type: "create", task: populatedTask });
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ error: "Server error creating task" });
  }
};

exports.editTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { changes, username, version } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Conflict Handling
    if (
      version &&
      task.lastModifiedAt &&
      task.lastModifiedAt.getTime() !== new Date(version).getTime()
    ) {
      return res.status(409).json({
        conflict: true,
        current: task,
        yourChanges: changes,
      });
    }

    // Track what actually changed
    const changedFields = {};
    for (let key in changes) {
      if (task[key]?.toString() !== changes[key]?.toString()) {
        changedFields[key] = {
          oldValue: task[key],
          newValue: changes[key],
        };
        task[key] = changes[key]; // Apply change
      }
    }

    task.lastModifiedBy = username;
    task.lastModifiedAt = new Date();
    await task.save();

    // General task edit log
    await Log.create({
      taskId: id,
      user: username,
      action: "Edited task",
      timestamp: new Date(),
    });

    // Per-field change logs
    const fieldLogs = Object.entries(changedFields).map(
      ([field, { oldValue, newValue }]) => ({
        taskId: id,
        user: username,
        action: `Changed ${field}`,
        field,
        oldValue,
        newValue,
        timestamp: new Date(),
      })
    );

    if (fieldLogs.length > 0) {
      await Log.insertMany(fieldLogs);
    }

    getIO().emit("taskUpdate", { type: "edit", task });
    res.json(task);
  } catch (error) {
    console.error("Edit Task Error:", error);
    res.status(500).json({ error: "Server error editing task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await Log.create({
      taskId: id,
      user: username,
      action: "Deleted task",
      timestamp: new Date(),
    });

    getIO().emit("taskUpdate", { type: "delete", id });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ error: "Server error deleting task" });
  }
};

exports.smartAssign = async (req, res) => {
  try {
    const { taskId, username } = req.body;

    const users = await User.find();
    const tasks = await Task.find({ status: { $ne: "Done" } });

    const counts = {};
    users.forEach((u) => (counts[u._id.toString()] = 0));
    tasks.forEach((t) => {
      if (t.assignedTo) {
        const key = t.assignedTo.toString();
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const leastUserId = Object.entries(counts).sort(
      (a, b) => a[1] - b[1]
    )[0][0];

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        assignedTo: leastUserId,
        lastModifiedBy: username,
        lastModifiedAt: new Date(),
      },
      { new: true }
    ).populate("assignedTo");

    await Log.create({
      taskId,
      user: username,
      action: "Smart Assigned task",
      timestamp: new Date(),
    });

    getIO().emit("taskUpdate", { type: "edit", task });
    res.json(task);
  } catch (error) {
    console.error("Smart Assign Error:", error);
    res.status(500).json({ error: "Server error smart assigning task" });
  }
};

exports.getRecentLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate("taskId");
    res.json(logs);
  } catch (error) {
    console.error("Log fetch error:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "email username");

    res.json(tasks);
  } catch (error) {
    console.error("Task fetch error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

exports.getTaskLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await Log.find({ taskId: id }).sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching task logs:", error);
    res.status(500).json({ error: "Failed to fetch task logs" });
  }
};

exports.getUserTaskCounts = async (req, res) => {
  try {
    const result = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          count: 1,
          user: { username: "$user.username", email: "$user.email" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error fetching task counts per user:", err);
    res.status(500).json({ error: "Server error fetching user task counts" });
  }
};

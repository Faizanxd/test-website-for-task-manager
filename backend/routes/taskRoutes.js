const express = require("express");
const router = express.Router();
const {
  createTask,
  editTask,
  deleteTask,
  smartAssign,
  getRecentLogs,
  getAllTasks,
  getTaskLogs,
  getUserTaskCounts,
} = require("../controllers/taskController");

router.post("/", createTask);
router.put("/:id", editTask);
router.delete("/:id", deleteTask);
router.post("/smart-assign", smartAssign);
router.get("/logs/recent", getRecentLogs);
router.get("/:id/logs", getTaskLogs); // ✅ Correct logs route
router.get("/", getAllTasks); // ✅ No duplicate
router.get("/user-counts", getUserTaskCounts);

module.exports = router;

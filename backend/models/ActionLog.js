const mongoose = require("mongoose");

const actionLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  user: String,
  action: String,
  field: { type: String, default: null }, // Optional: field name that changed
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null }, // Optional: previous value
  newValue: { type: mongoose.Schema.Types.Mixed, default: null }, // Optional: new value
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActionLog", actionLogSchema);

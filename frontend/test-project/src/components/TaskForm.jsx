import { useState, useEffect } from "react";
import axios from "../api/axios"; // or wherever your axios helper is
import useAuth from "../context/useAuth";

function TaskForm({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/users");
        setUsers(res.data);
        console.log("Fetched users:", res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setAssignedTo("");
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) return alert("Please select a user");

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        title,
        description: desc,
        priority,
        username: user.username,
        board: "Main",
        assignedTo,
      });

      console.log("Task created:", res.data);
      alert("Task created successfully");
      resetForm();
      onTaskCreated?.();
    } catch (err) {
      console.error("Manual task error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Error creating task");
    }
  };

  const handleSmartAssign = async (e) => {
    e.preventDefault();

    try {
      // Step 1: create task without assignedTo
      const createRes = await axios.post("http://localhost:5000/api/tasks", {
        title,
        description: desc,
        priority,
        username: user.username,
        board: "Main",
        assignedTo: null,
      });

      const taskId = createRes.data._id;
      console.log("Created task for smart assign:", taskId);

      // Step 2: call smart-assign
      const smartRes = await axios.post(
        "http://localhost:5000/api/tasks/smart-assign",
        {
          taskId,
          username: user.username,
        }
      );

      console.log("Smart assigned:", smartRes.data);
      alert("Task smart assigned successfully");
      resetForm();
      onTaskCreated?.();
    } catch (err) {
      console.error("Smart assign error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Smart assign failed");
    }
  };

  return (
    <form>
      <h3>Create Task</h3>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <br />

      <input
        type="text"
        placeholder="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <br />

      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <br />

      <select
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
      >
        <option value="">-- Select a user --</option>
        {users.map((u) => (
          <option key={u._id} value={u.email}>
            {u.email}
          </option>
        ))}
      </select>
      <br />

      <button onClick={handleManualSubmit}>Create Task</button>
      <button onClick={handleSmartAssign} style={{ marginLeft: "10px" }}>
        Smart Assign
      </button>
    </form>
  );
}

export default TaskForm;

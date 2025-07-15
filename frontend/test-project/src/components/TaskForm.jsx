import { useState, useEffect } from "react";
import axios from "../api/axios";
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
        const res = await axios.get("/api/auth/users");
        setUsers(res.data);
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
      await axios.post("/api/tasks", {
        title,
        description: desc,
        priority,
        username: user.username,
        board: "Main",
        assignedTo,
      });

      alert("Task created successfully");
      resetForm();
      onTaskCreated?.();
    } catch (err) {
      alert(err.response?.data?.error || "Error creating task");
    }
  };

  const handleSmartAssign = async (e) => {
    e.preventDefault();

    try {
      const createRes = await axios.post("/api/tasks", {
        title,
        description: desc,
        priority,
        username: user.username,
        board: "Main",
        assignedTo: null,
      });

      const taskId = createRes.data._id;

      await axios.post("/api/tasks/smart-assign", {
        taskId,
        username: user.username,
      });

      alert("Task smart assigned successfully");
      resetForm();
      onTaskCreated?.();
    } catch (err) {
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

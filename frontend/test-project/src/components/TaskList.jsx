import { useEffect, useState } from "react";
import axios from "../api/axios";
import socket from "../socket";
import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [taskLogs, setTaskLogs] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const [editingTask, setEditingTask] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // 🔍 Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadTasks = async () => {
      try {
        const res = await axios.get("/api/tasks");
        const tasksData = res.data;
        setTasks(tasksData);

        const logsByTask = {};
        await Promise.all(
          tasksData.map(async (task) => {
            try {
              const logRes = await axios.get(`/api/tasks/${task._id}/logs`);
              logsByTask[task._id] = logRes.data;
            } catch (logErr) {
              console.error(`Failed to load logs for ${task.title}`, logErr);
            }
          })
        );
        setTaskLogs(logsByTask);
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    };

    loadTasks();
    socket.on("taskUpdate", loadTasks);
    return () => socket.off("taskUpdate", loadTasks);
  }, [user, navigate]);

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`, {
        data: { username: user.username },
      });
      alert("Task deleted");
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert("Failed to delete task");
    }
  };

  const submitEdit = async () => {
    try {
      await axios.put(`/api/tasks/${editingTask._id}`, {
        changes: {
          title: editingTask.title,
          status: editingTask.status,
          priority: editingTask.priority,
        },
        version: editingTask.lastModifiedAt,
        username: user.username,
      });
      setEditingTask(null);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictData(err.response.data);
      } else {
        console.error("Edit error:", err);
        alert("Failed to update task");
      }
    }
  };

  const resolveConflict = async (useServerVersion = false) => {
    const taskToSend = useServerVersion
      ? conflictData.current
      : conflictData.yourChanges;

    try {
      await axios.put(`/api/tasks/${conflictData.current._id}`, {
        changes: taskToSend,
        username: user.username,
      });
      setConflictData(null);
      setEditingTask(null);
    } catch (err) {
      console.error("Conflict resolution failed:", err);
    }
  };

  if (!user) return null;

  return (
    <div>
      <h3>Tasks for {user.username}</h3>

      {/* 🔍 Search & Filters */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by title or user"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginRight: "10px", padding: "4px" }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="All">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* 🔄 Task List */}
      {tasks.length === 0 ? (
        <p>No tasks assigned</p>
      ) : (
        tasks
          .filter((task) => {
            const matchesSearch =
              task.title.toLowerCase().includes(search.toLowerCase()) ||
              task.assignedTo?.username
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
              task.assignedTo?.email
                ?.toLowerCase()
                .includes(search.toLowerCase());

            const matchesStatus =
              statusFilter === "All" || task.status === statusFilter;

            const matchesPriority =
              priorityFilter === "All" || task.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
          })
          .map((task) => (
            <div
              key={task._id}
              style={{
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            >
              <strong>{task.title}</strong> <br />
              <em>Status:</em> {task.status} <br />
              <em>Priority:</em> {task.priority} <br />
              <em>Assigned To:</em>{" "}
              {task.assignedTo?.username ||
                task.assignedTo?.email ||
                "Unassigned"}
              <br />
              {taskLogs[task._id]?.length > 0 && (
                <div style={{ fontSize: "12px", color: "#555" }}>
                  <em>Last change:</em> {taskLogs[task._id][0].user} —{" "}
                  {taskLogs[task._id][0].action} (
                  {new Date(
                    taskLogs[task._id][0].timestamp
                  ).toLocaleTimeString()}
                  )
                </div>
              )}
              <br />
              <button onClick={() => deleteTask(task._id)}>Delete</button>
              <button onClick={() => setEditingTask(task)}>Edit</button>
            </div>
          ))
      )}

      {/* 🛠 Edit Modal */}
      {editingTask && (
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "30%",
            padding: "20px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            zIndex: 10,
          }}
        >
          <h4>Edit Task</h4>
          <input
            value={editingTask.title}
            onChange={(e) =>
              setEditingTask({ ...editingTask, title: e.target.value })
            }
          />
          <br />
          <select
            value={editingTask.status}
            onChange={(e) =>
              setEditingTask({ ...editingTask, status: e.target.value })
            }
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <br />
          <select
            value={editingTask.priority}
            onChange={(e) =>
              setEditingTask({ ...editingTask, priority: e.target.value })
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <br />
          <button onClick={submitEdit}>Save</button>
          <button onClick={() => setEditingTask(null)}>Cancel</button>
        </div>
      )}

      {/* ⚠️ Conflict Modal */}
      {conflictData && (
        <div
          style={{
            position: "fixed",
            top: "25%",
            left: "25%",
            padding: "20px",
            background: "#fff",
            border: "1px solid red",
            borderRadius: "8px",
            zIndex: 20,
          }}
        >
          <h4>Conflict Detected</h4>
          <p>Another user updated this task.</p>
          <div>
            <h5>Server Version:</h5>
            <pre>{JSON.stringify(conflictData.current, null, 2)}</pre>
          </div>
          <div>
            <h5>Your Changes:</h5>
            <pre>{JSON.stringify(conflictData.yourChanges, null, 2)}</pre>
          </div>
          <button onClick={() => resolveConflict(true)}>Overwrite Mine</button>
          <button onClick={() => resolveConflict(false)}>Keep Mine</button>
        </div>
      )}
    </div>
  );
}

export default TaskList;

import { useEffect, useState } from "react";
import axios from "../api/axios"; // or wherever your axios helper is
import socket from "../socket";

function Logs({ taskId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const endpoint = taskId
        ? `/api/tasks/${taskId}/logs`
        : `/api/tasks/logs/recent`;
      const res = await axios.get(endpoint);
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        console.warn("Unexpected logs format:", res.data);
        setLogs([]); // fallback
      }
    } catch (err) {
      console.error("Error loading logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    console.log("Rendered Logs:", logs);
    const handleUpdate = (data) => {
      if (!taskId || data.task?._id === taskId) {
        loadLogs();
      }
    };

    socket.on("taskUpdate", handleUpdate);
    return () => {
      socket.off("taskUpdate", handleUpdate);
    };
  }, [loadLogs, logs, taskId]);

  if (loading) return <p>Loading logs...</p>;
  if (!logs.length) return <p>No logs yet.</p>;

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="text-lg font-semibold mb-2">
        {taskId ? "Task Activity Timeline" : "Recent Logs"}
      </h3>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log._id}
            className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-2 rounded"
          >
            <div className="text-sm text-blue-800 font-medium">
              {log.user} — {log.action}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(log.timestamp).toLocaleString()}
            </div>
            {log.field && (
              <div className="text-xs text-gray-700 mt-1">
                <strong>{log.field}</strong>: "{log.oldValue}" → "{log.newValue}
                "
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Logs;

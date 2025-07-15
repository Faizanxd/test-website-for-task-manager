import { useEffect, useState } from "react";
import axios from "../api/axios"; // or wherever your axios helper is

function TaskTimeline({ taskId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`/api/tasks/${taskId}/logs`);
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch task logs", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchLogs();
    }
  }, [taskId]);

  if (loading) return <p>Loading timeline...</p>;
  if (!logs.length) return <p>No activity logged yet.</p>;

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-4">
      <h2 className="text-lg font-semibold mb-2">Activity Timeline</h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log._id}
            className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 hover:bg-gray-100 transition rounded"
          >
            <p className="text-sm">
              <span className="font-medium text-blue-700">{log.user}</span>{" "}
              <span className="text-gray-600">{log.action}</span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(log.timestamp).toLocaleString()}
            </p>
            {log.field && (
              <p className="text-xs mt-1 text-gray-700">
                <strong>{log.field}</strong>: "{log.oldValue}" → "{log.newValue}
                "
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskTimeline;

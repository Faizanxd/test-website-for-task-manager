import { useEffect, useState } from "react";
import axios from "../api/axios"; // adjust path if needed

function UserTaskCounts() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const res = await axios.get("/api/tasks/user-counts");
      setCounts(res.data);
    } catch (err) {
      console.error("Error fetching task counts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h3>User Task Counts</h3>
      {loading ? (
        <p>Loading...</p>
      ) : counts.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th># of Tasks</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ user, count }) => (
              <tr key={user.email}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserTaskCounts;

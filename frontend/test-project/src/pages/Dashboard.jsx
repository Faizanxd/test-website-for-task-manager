import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Logs from "../components/Logs";
import useAuth from "../context/useAuth";
import UserTaskCounts from "../components/UserTaskCounts";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.username}</h2>
      <button onClick={logout}>Logout</button>

      <p>
        <Link to="/kanban">Go to Kanban Board</Link>
      </p>
      <h3>Task Manager</h3>
      <TaskForm />
      <TaskList />
      <UserTaskCounts />
      <Logs />
    </div>
  );
}

export default Dashboard;

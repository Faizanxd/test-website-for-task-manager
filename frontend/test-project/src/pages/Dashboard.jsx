import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Logs from "../components/Logs";
import useAuth from "../context/useAuth";
import UserTaskCounts from "../components/UserTaskCounts";
import KanbanBoard from "./KanbanBoard";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.username}</h2>
      <button onClick={logout}>Logout</button>

      <h3>Task Manager</h3>
      <TaskForm />
      <TaskList />
      <KanbanBoard />
      <UserTaskCounts />
      <Logs />
    </div>
  );
}

export default Dashboard;

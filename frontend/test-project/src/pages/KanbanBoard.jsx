import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "../api/axios";
import socket from "../socket";

const columns = ["Todo", "In Progress", "Done"];

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await axios.get("/api/tasks");
      setTasks(res.data);
      setLocalTasks(res.data); // Local clone to avoid live updates during drag
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    socket.on("taskUpdate", loadTasks);
    return () => socket.off("taskUpdate", loadTasks);
  }, [loadTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const updatedStatus = destination.droppableId;

    // Optimistic UI update: move item in localTasks immediately
    const updatedTasks = localTasks.map((task) =>
      task._id === draggableId ? { ...task, status: updatedStatus } : task
    );
    setLocalTasks(updatedTasks);

    try {
      const task = tasks.find((t) => t._id === draggableId);
      await axios.put(`/api/tasks/${task._id}`, {
        changes: { status: updatedStatus },
        version: task.lastModifiedAt,
        username: "kanban-board",
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
      // Revert UI if failed
      setLocalTasks(tasks);
    }
  };

  const getTasksByStatus = (status) =>
    localTasks.filter((t) => t.status === status);

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {columns.map((column) => (
          <Droppable droppableId={column} key={column}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  minHeight: "500px",
                  padding: "12px",
                  background: snapshot.isDraggingOver ? "#e2e8f0" : "#f1f5f9",
                  borderRadius: "8px",
                  transition: "background 0.2s ease",
                  overflowY: "auto",
                }}
              >
                <h3 style={{ marginBottom: "10px", fontWeight: 600 }}>
                  {column}
                </h3>

                {getTasksByStatus(column).map((task, index) => (
                  <Draggable
                    draggableId={task._id}
                    index={index}
                    key={task._id}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          padding: "12px",
                          marginBottom: "10px",
                          background: "white",
                          borderRadius: "6px",
                          border: snapshot.isDragging
                            ? "2px solid #60a5fa"
                            : "1px solid #d1d5db",
                          boxShadow: snapshot.isDragging
                            ? "0 6px 12px rgba(0, 0, 0, 0.1)"
                            : "none",
                          transition: "all 0.2s ease",
                          cursor: "grab",
                        }}
                      >
                        <strong>{task.title}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          Priority: {task.priority}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}

export default KanbanBoard;

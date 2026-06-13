import { useEffect, useState } from "react";
import { getTasks, createTask, deleteTask } from "./api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);

      const response = await getTasks();

      setTasks(
        Array.isArray(response.data)
          ? response.data
          : response.data
          ? [response.data]
          : []
      );
    } catch (error) {
      console.error("Error loading tasks:", error);
      setMessage("❌ Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const addTask = async () => {
    if (!title.trim()) return;

    try {
      await createTask(title);

      setMessage("✅ Task created successfully");
      setTitle("");

      await loadTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setMessage("❌ Failed to create task");
    }
  };

  const removeTask = async (taskId) => {
    try {
      await deleteTask(taskId);

      setMessage("✅ Task deleted successfully");

      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setMessage("❌ Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) =>
    (task.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const openTasks = tasks.filter(
    (task) => task.status === "OPEN"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  return (
    <div className="container mt-5">

      <h1 className="mb-4 text-center">
        🚀 Serverless Task Manager
      </h1>

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="row mb-4">

        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm">
            <h6>Total Tasks</h6>
            <h3>{tasks.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm">
            <h6>Open Tasks</h6>
            <h3>{openTasks}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm">
            <h6>Completed Tasks</h6>
            <h3>{completedTasks}</h3>
          </div>
        </div>

      </div>

      {/* Create Task */}
      <div className="card p-3 mb-4 shadow-sm">

        <h5>Create Task</h5>

        <input
          className="form-control mb-2"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
        />

        <button
          className="btn btn-primary"
          onClick={addTask}
        >
          Create Task
        </button>

      </div>

      {/* Task List */}
      <div className="card p-3 shadow-sm">

        <div className="d-flex justify-content-between align-items-center mb-3">

          <h5>Tasks ({filteredTasks.length})</h5>

          <input
            className="form-control"
            style={{ maxWidth: "300px" }}
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>

        {loading ? (
          <div className="text-center">

            <div
              className="spinner-border"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

          </div>
        ) : (
          <table className="table table-striped table-hover">

            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No Tasks Found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.taskId}>

                    <td title={task.taskId}>
                      {task.taskId.substring(0, 8)}...
                    </td>

                    <td>{task.title}</td>

                    <td>
                      <span
                        className={
                          task.status === "DONE"
                            ? "badge bg-primary"
                            : "badge bg-success"
                        }
                      >
                        {task.status}
                      </span>
                    </td>

                    <td>
                      {task.createdAt
                        ? new Date(
                            task.createdAt
                          ).toLocaleString()
                        : "Legacy Record"}
                    </td>

                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          removeTask(task.taskId)
                        }
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>
        )}

      </div>

      <footer className="text-center mt-5 mb-3 text-muted">
        Built with React • AWS Lambda • API Gateway • DynamoDB • Terraform
      </footer>

    </div>
  );
}

export default App;
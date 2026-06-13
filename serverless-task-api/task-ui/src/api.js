import axios from "axios";

const API_URL =
  "https://a1rrdezzs2.execute-api.us-east-2.amazonaws.com";

export const getTasks = () =>
  axios.get(`${API_URL}/tasks`);

export const createTask = (title) =>
  axios.post(`${API_URL}/tasks`, {
    title
  });

export const deleteTask = (taskId) =>
  axios.delete(`${API_URL}/tasks/${taskId}`);
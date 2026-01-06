// frontend/src/lib/api.ts

const API_URL = "http://127.0.0.1:8000";

export async function getProjectState() {
  const res = await fetch(`${API_URL}/state`);
  return res.json();
}

export async function updateProject(data: any) {
  const res = await fetch(`${API_URL}/update-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
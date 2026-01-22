// frontend/src/lib/api.ts
/**
 * API utilities with session management for multi-tenancy support.
 */

const API_URL = "http://127.0.0.1:8000";
const SESSION_STORAGE_KEY = "clarity_session_id";

/**
 * Generate a UUID v4 for session identification.
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a session ID from localStorage.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    // SSR fallback - generate but don't persist
    return generateUUID();
  }

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    console.log("[Session] Created new session:", sessionId);
  }

  return sessionId;
}

/**
 * Clear the current session and generate a new one.
 * Used when backend reports session is invalid/expired.
 */
export function resetSession(): string {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return getSessionId();
}

/**
 * Get headers with session ID included.
 */
export function getSessionHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Session-ID": getSessionId(),
  };
}

/**
 * Custom error class for session-related errors.
 */
export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
  }
}

/**
 * Handle API response, checking for session errors.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Check for session-related errors
    if (response.status === 404 || response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      if (
        errorData.detail?.toLowerCase().includes("session") ||
        errorData.detail?.toLowerCase().includes("not found")
      ) {
        throw new SessionError(errorData.detail || "Session invalid or expired");
      }
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch the current project state for this session.
 */
export async function getProjectState() {
  const response = await fetch(`${API_URL}/state`, {
    headers: getSessionHeaders(),
  });
  return handleResponse(response);
}

/**
 * Update project with form data.
 */
export async function updateProject(data: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/update-project`, {
    method: "POST",
    headers: getSessionHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Fetch external CRM data.
 */
export async function fetchExternalData() {
  const response = await fetch(`${API_URL}/fetch-external-data`, {
    method: "POST",
    headers: getSessionHeaders(),
  });
  return handleResponse(response);
}

/**
 * Run the planner agent.
 */
export async function runPlanner() {
  const response = await fetch(`${API_URL}/run-planner`, {
    method: "POST",
    headers: getSessionHeaders(),
  });
  return handleResponse(response);
}

/**
 * Run the PRD agent.
 */
export async function runPrd() {
  const response = await fetch(`${API_URL}/run-prd`, {
    method: "POST",
    headers: getSessionHeaders(),
  });
  return handleResponse(response);
}

/**
 * Send a chat message (returns Response for streaming).
 */
export async function sendChatMessage(message: string): Promise<Response> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: getSessionHeaders(),
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Chat API Error: ${response.status}`);
  }

  return response;
}

/**
 * Create a new session explicitly (useful for "New Project" button).
 */
export async function createNewSession(): Promise<{ session_id: string }> {
  // Clear local session first
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  const response = await fetch(`${API_URL}/session/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await handleResponse<{ session_id: string; message: string }>(response);

  // Store the new session ID
  if (typeof window !== "undefined" && data.session_id) {
    localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
    console.log("[Session] Switched to new session:", data.session_id);
  }

  return data;
}

/**
 * Get all available sessions from the database.
 */
export async function getAllSessions(): Promise<{
  sessions: Array<{
    session_id: string;
    created_at: string | null;
    updated_at: string | null;
    project_name: string;
    current_step: string;
  }>;
  count: number;
}> {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}

/**
 * Switch to a specific session by ID.
 * This updates localStorage and returns the session ID.
 */
export function switchToSession(sessionId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    console.log("[Session] Switched to session:", sessionId);
  }
}

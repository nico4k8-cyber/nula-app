/**
 * Backend API client for SHARIEL
 * Handles answer validation and task retrieval
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// Extract ref parameter from URL (e.g., ?ref=camp_star_001)
export function getSourceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || 'organic';
}

/**
 * Fetch task from backend
 */
export async function fetchTask(taskId) {
  const response = await fetch(`${API_BASE}/api/tasks/${taskId}`);
  if (!response.ok) throw new Error(`Task ${taskId} not found`);
  return response.json();
}

/**
 * Validate user answer against task options
 * Returns { score, earnsCrystal, feedback, realSolution, bonusFact, trizInsight, ... }
 */
export async function validateAnswer(taskId, answer, userId, sessionId, source) {
  const response = await fetch(`${API_BASE}/api/tasks/${taskId}/validate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answer,
      userId,
      sessionId,
      source,
    }),
  });

  if (!response.ok) throw new Error('Answer validation failed');
  return response.json();
}

/**
 * Log answer for analytics
 */
export async function logAnswer(userId, taskId, score, source) {
  const response = await fetch(`${API_BASE}/api/log-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      taskId,
      score,
      source,
    }),
  });

  if (!response.ok) console.error('Failed to log answer');
  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

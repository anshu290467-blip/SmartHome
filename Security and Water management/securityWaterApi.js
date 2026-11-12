// This URL will be replaced by Member 5's backend URL later
const API_BASE_URL = 'http://localhost:5000/api';

export const fetchSecurityWaterStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/member4/status`);
  if (!response.ok) throw new Error('Backend unreachable');
  return response.json();
};

export const updateControlState = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/member4/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to send command');
  return response.json();
};
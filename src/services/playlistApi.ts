const API_BASE_URL = 'http://localhost:5050/api';

export const generatePlaylistWithBackend = async (prompt: string, spotifyToken?: string) => {
  const response = await fetch(`${API_BASE_URL}/generate-playlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, token: spotifyToken }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate playlist');
  }
  return response.json();
}; 
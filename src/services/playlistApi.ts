export const generatePlaylistWithBackend = async (prompt: string) => {
  const response = await fetch('http://127.0.0.1:5050/api/generate-playlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate playlist');
  }
  return response.json();
}; 
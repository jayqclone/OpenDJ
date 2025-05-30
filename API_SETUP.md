# API Setup Guide

## Environment Configuration

### 1. Create `.env` file
Create a `.env` file in the root directory with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Spotify Configuration (Frontend)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here

# Server Configuration
PORT=5000
```

### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it as `OPENAI_API_KEY` in your `.env` file

### 3. Get Spotify Client ID
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Create a new app
4. Copy the Client ID
5. Add `http://localhost:5173` to the Redirect URIs in your app settings
6. Paste the Client ID as `VITE_SPOTIFY_CLIENT_ID` in your `.env` file

## Running the Application

### 1. Start the Backend Server
```bash
node server.js
```
The server will run on port 5000 by default.

### 2. Start the Frontend
```bash
npm run dev
```
The frontend will typically run on port 5173.

## Troubleshooting Common Issues

### OpenAI Issues
- **Error 401**: Check your API key is correct and has billing enabled
- **Error 429**: You've hit rate limits or quota - the app will fall back to mock data
- **Error 500**: OpenAI server issues - the app will fall back to mock data

### Spotify Issues
- **Authentication failed**: 
  - Check your Spotify Client ID is correct
  - Ensure redirect URI is properly configured in Spotify app settings
  - Make sure you're logged into Spotify in your browser

- **Rate limiting**: 
  - The app includes automatic retry logic with exponential backoff
  - If issues persist, wait a few minutes before trying again

- **No tracks found**: 
  - Some tracks might not be available on Spotify
  - The app will create the playlist with available tracks only

### Network Issues
- **Connection refused**: 
  - Make sure the backend server is running on port 5000
  - Check that no firewall is blocking the connection
  - Verify the frontend is calling the correct backend URL

## Updated Features

### Enhanced Error Handling
- Better error messages for API failures
- Automatic fallback to mock data when OpenAI fails
- Retry logic for Spotify rate limits
- Detailed logging for debugging

### Improved Spotify Integration
- Better track search with cleaned queries
- Batch processing for large playlists
- Improved matching algorithm
- Rate limiting protection

### Robust Backend
- Proper environment variable usage
- Enhanced OpenAI error handling
- Better logging and debugging
- Graceful fallback mechanisms 
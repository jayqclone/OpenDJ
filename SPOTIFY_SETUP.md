# Spotify OAuth Setup Guide

This guide will help you set up Spotify OAuth authentication for the PlaylistAI application.

## Prerequisites

1. A Spotify Developer Account
2. A registered Spotify App

## Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill out the form:
   - **App Name**: PlaylistAI (or your preferred name)
   - **App Description**: AI-powered playlist generator
   - **Website**: `http://localhost:5175` (for development)
   - **Redirect URI**: `http://127.0.0.1:5175/callback`
5. Check the boxes for the Terms of Service and Design Guidelines
6. Click "Create"

## Step 2: Configure Your App Settings

1. In your newly created app, click "Settings"
2. Note down your **Client ID** and **Client Secret**
3. In the "Redirect URIs" section, make sure you have:
   - `http://127.0.0.1:5175/callback`
   - `http://localhost:5175/callback` (optional, for alternative local setup)

## Step 3: Update Environment Variables

Update your `.env` file with your Spotify credentials:

```env
# Spotify Configuration
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=http://127.0.0.1:5175/callback

# Other existing variables...
```

Replace `your_client_id_here` and `your_client_secret_here` with the actual values from your Spotify app.

## Step 4: Spotify API Scopes

The application requests the following Spotify scopes:

- `playlist-modify-private`: Create and modify private playlists
- `playlist-modify-public`: Create and modify public playlists  
- `user-read-email`: Access user's email address

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `http://127.0.0.1:5175`
3. Click "Login to Spotify" 
4. You should be redirected to Spotify's authorization page
5. After granting permissions, you'll be redirected back to your app
6. Generate a playlist and try exporting it to Spotify

## Features

With the real Spotify OAuth implementation, you can now:

- ✅ Authenticate with your Spotify account
- ✅ Search for tracks on Spotify to get real track data and artwork
- ✅ Create playlists directly in your Spotify account
- ✅ Add AI-generated tracks to your Spotify playlists
- ✅ Get real Spotify URLs for your created playlists

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in your Spotify app settings exactly matches `http://127.0.0.1:5175/callback`
- Use `127.0.0.1` instead of `localhost` if you encounter issues

### "Invalid client" error  
- Double-check your Client ID in the `.env` file
- Make sure there are no extra spaces or quotes around the client ID

### Tracks not found on Spotify
- The app searches for tracks using artist and song title
- Some AI-generated tracks might not exist on Spotify
- The app will skip tracks that can't be found and add the ones that are available

### Development vs Production
- For production deployment, you'll need to:
  - Update the redirect URI to your production domain
  - Add the production redirect URI to your Spotify app settings
  - Update the `VITE_REDIRECT_URI` environment variable

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret private
- Use environment variables for all sensitive configuration
- The Client Secret is only used server-side (not in this client-only app) 
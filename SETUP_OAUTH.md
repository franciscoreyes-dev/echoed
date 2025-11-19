# Spotify OAuth Setup Guide

This guide will walk you through setting up Spotify OAuth authentication for Echoed.

## Prerequisites

- A Spotify account (free or premium)
- Node.js and npm installed

## Step 1: Create a Spotify Developer Application

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create a New App**
   - Click "Create app"
   - Fill in the required information:
     - **App name**: `Echoed` (or any name you prefer)
     - **App description**: `Spotify data visualization application`
     - **Website**: Leave blank or use `http://localhost:5173`
     - **Redirect URI**: `http://localhost:5173/callback` ⚠️ **IMPORTANT**
   - Check the box agreeing to Spotify's Terms of Service
   - Click "Save"

3. **Configure Redirect URIs**
   - After creating the app, click "Settings"
   - Under "Redirect URIs", ensure `http://localhost:5173/callback` is listed
   - If deploying to production later, add your production URL: `https://yourdomain.com/callback`
   - Click "Save"

4. **Get Your Credentials**
   - Click "Settings" if not already there
   - You'll see:
     - **Client ID**: A long string (e.g., `a1b2c3d4e5f6g7h8i9j0...`)
     - **Client Secret**: Click "View client secret" (you won't need this for PKCE flow)
   - **Copy your Client ID** - you'll need it for the next step

## Step 2: Configure Environment Variables

1. **Create a .env file**
   - In the project root directory (`echoed/`), create a file named `.env`
   - Copy the contents from `.env.example`:

   ```bash
   # From project root
   cp .env.example .env
   ```

2. **Add Your Spotify Client ID**
   - Open the `.env` file
   - Replace `your_client_id_here` with your actual Client ID from Step 1:

   ```env
   # Spotify OAuth Configuration
   VITE_SPOTIFY_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0klmnopqrstuv

   # Redirect URI (must match Spotify Dashboard)
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
   ```

3. **Verify the Redirect URI**
   - Ensure `VITE_SPOTIFY_REDIRECT_URI` matches exactly what you set in Spotify Dashboard
   - For development: `http://localhost:5173/callback`
   - For production: Update to your production domain

## Step 3: Install Dependencies and Run

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   - Navigate to: http://localhost:5173
   - You should see the Echoed homepage

## Step 4: Test the Authentication Flow

1. **Click "Connect to Spotify"**
   - You'll be redirected to Spotify's authorization page

2. **Authorize the Application**
   - Review the permissions requested
   - Click "Agree" or "Accept"

3. **Redirected Back to Echoed**
   - You'll be redirected to `/callback`
   - The app will exchange the authorization code for access tokens
   - You'll be redirected to the home page
   - You should see "Welcome back, [Your Name]!"

4. **Verify Authentication**
   - Your Spotify avatar should appear in the header
   - You should see a logout button
   - The navigation should show your authenticated state

## Troubleshooting

### "Invalid client" Error
- **Problem**: Client ID is incorrect
- **Solution**: Double-check your Client ID in `.env` matches Spotify Dashboard

### "Invalid redirect URI" Error
- **Problem**: Redirect URI doesn't match Spotify Dashboard settings
- **Solution**:
  1. Verify `.env` has: `VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback`
  2. Verify Spotify Dashboard has the same URI in Settings → Redirect URIs
  3. Make sure there are no trailing slashes or typos

### "State mismatch" Error
- **Problem**: CSRF token validation failed
- **Solution**:
  - Clear your browser's localStorage/sessionStorage
  - Try the authentication flow again
  - This can happen if you interrupt the OAuth flow mid-process

### Tokens Not Persisting After Refresh
- **Problem**: Authentication lost after page reload
- **Solution**:
  - Check browser console for errors
  - Verify localStorage is enabled in your browser
  - Check that `initializeAuth()` is being called in `App.vue`

### 401 Unauthorized When Making API Calls
- **Problem**: Token has expired or is invalid
- **Solution**:
  - The app should automatically refresh tokens
  - If it doesn't work, try logging out and back in
  - Check browser console for refresh token errors

### CORS Errors
- **Problem**: Browser blocking Spotify API requests
- **Solution**:
  - CORS is handled by Spotify's servers
  - This shouldn't happen in normal operation
  - If you see CORS errors, verify you're using the correct Spotify API endpoints

## Security Notes

### PKCE (Proof Key for Code Exchange)
This application uses PKCE for OAuth, which means:
- ✅ You **do NOT** need to use the Client Secret
- ✅ The Client Secret should **NOT** be in your `.env` file
- ✅ PKCE is more secure for single-page applications
- ✅ All OAuth flow happens in the browser securely

### Token Storage
- Access tokens are stored in **localStorage**
- Refresh tokens are stored in **localStorage**
- Tokens are **never** sent to any server except Spotify's official API
- For production apps, consider additional security measures

### Scopes
The application requests the following Spotify scopes:
- `user-read-private` - Read user profile
- `user-read-email` - Read user email
- `user-library-read` - Read saved tracks/albums
- `user-library-modify` - Modify saved tracks/albums
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Read currently playing track
- `user-read-recently-played` - Read listening history
- `user-top-read` - Read top artists/tracks
- `playlist-read-private` - Read private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `playlist-modify-public` - Modify public playlists
- `playlist-modify-private` - Modify private playlists
- `streaming` - Web Playback SDK

You can modify these scopes in `src/config/spotify.ts` if needed.

## Production Deployment

When deploying to production:

1. **Update Redirect URI in Spotify Dashboard**
   - Add your production URL: `https://yourdomain.com/callback`

2. **Update Environment Variables**
   - Set `VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/callback`

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy**
   - Deploy the `dist/` folder to your hosting service

## API Rate Limits

Spotify API has rate limits:
- **Standard**: ~180 requests per minute
- **Extended**: Up to ~360 requests per minute with proper authentication

The app handles rate limiting (429 errors) gracefully, but be mindful of excessive API calls.

## Need Help?

- **Spotify Developer Documentation**: https://developer.spotify.com/documentation/web-api
- **OAuth 2.0 Guide**: https://developer.spotify.com/documentation/web-api/concepts/authorization
- **PKCE Flow**: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

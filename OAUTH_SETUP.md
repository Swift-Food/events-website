# OAuth Authentication Setup Guide

This guide will help you set up Google and Apple OAuth authentication for your Events Website.

## Overview

The OAuth implementation supports both Google and Apple Sign-In for event users with the following features:

- Login and registration flows
- Automatic token management
- Error handling and loading states
- Support for invite tokens (collaborators and tickets)
- Seamless integration with existing auth system

## Files Added/Modified

### New Files
- `src/lib/auth/useOAuth.ts` - Custom React hook for OAuth flows
- `src/components/auth/OAuthButtons.tsx` - Reusable Google and Apple OAuth button components
- `.env.local.example` - Environment variables template
- `OAUTH_SETUP.md` - This setup guide

### Modified Files
- `src/lib/auth/authApi.ts` - Added `appleLogin` and `appleRegister` methods
- `src/app/layout.tsx` - Added Google and Apple SDK scripts
- `src/components/auth/LoginForm.tsx` - Integrated OAuth buttons
- `src/components/auth/RegisterForm.tsx` - Integrated OAuth buttons
- `.env.local` - Added OAuth environment variable placeholders

## Setup Instructions

### 1. Google OAuth Setup

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** for your project

#### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

#### Step 3: Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Click **Create**
7. Copy the **Client ID**

#### Step 4: Add to Environment Variables
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### 2. Apple Sign-In Setup

#### Step 1: Register an App ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** > **+** (Add button)
4. Select **App IDs** and click **Continue**
5. Select **App** and click **Continue**
6. Fill in:
   - Description: Your app name
   - Bundle ID: `com.yourcompany.yourapp` (reverse domain notation)
7. Under **Capabilities**, enable **Sign in with Apple**
8. Click **Continue** and **Register**

#### Step 2: Create a Service ID
1. In **Identifiers**, click **+** again
2. Select **Services IDs** and click **Continue**
3. Fill in:
   - Description: Your service name (e.g., "Events Website Web")
   - Identifier: `com.yourcompany.yourapp.web`
4. Enable **Sign in with Apple**
5. Click **Configure** next to Sign in with Apple
6. Select your primary App ID
7. Add your domains:
   - Domain: `yourdomain.com` (no http/https)
   - Return URLs: `https://yourdomain.com/auth/apple/callback`
   - For development, you might need to use a tunneling service like ngrok
8. Click **Save** and **Continue**
9. Click **Register**

#### Step 3: Create a Key for Apple Sign-In
1. Navigate to **Keys** in the left sidebar
2. Click **+** to create a new key
3. Enter a name (e.g., "Sign in with Apple Key")
4. Enable **Sign in with Apple**
5. Click **Configure** and select your primary App ID
6. Click **Save**, then **Continue**, then **Register**
7. Download the key file (`.p8`) - you can only download this once!
8. Note the **Key ID** shown on the page

#### Step 4: Add to Environment Variables
```bash
NEXT_PUBLIC_APPLE_CLIENT_ID=com.yourcompany.yourapp.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
```

**Note for Development:**
- Apple Sign-In requires HTTPS
- For local development, use a tunneling service like [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)
- Update your redirect URI to the tunnel URL

### 3. Update .env.local File

Open your `.env.local` file and add the OAuth credentials:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com

# Apple OAuth Configuration
NEXT_PUBLIC_APPLE_CLIENT_ID=com.yourcompany.yourapp.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
```

### 4. Restart Development Server

After updating environment variables, restart your Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Testing

### Testing Google OAuth

1. Navigate to `/auth` in your browser
2. Click the **"Continue with Google"** button (login) or **"Sign up with Google"** button (register)
3. A Google Sign-In popup will appear
4. Select a Google account
5. Verify that you're redirected to the home page after successful authentication
6. Check the browser console for any errors
7. Verify that the auth token is stored in localStorage

### Testing Apple OAuth

1. Navigate to `/auth` in your browser
2. Click the **"Continue with Apple"** button (login) or **"Sign up with Apple"** button (register)
3. An Apple Sign-In popup will appear
4. Sign in with your Apple ID
5. Verify that you're redirected to the home page after successful authentication
6. Check the browser console for any errors
7. Verify that the auth token is stored in localStorage

### Testing Invite Flows

The OAuth implementation supports invite tokens for both collaborators and ticket holders:

1. Generate an invite link with an invite token (from your backend)
2. Add `?inviteToken=TOKEN&inviteType=collaborator` or `?inviteToken=TOKEN&inviteType=ticket` to the auth URL
3. Click an OAuth button
4. Verify that the user is properly linked to the invitation after authentication

## How It Works

### Architecture

```
┌─────────────────┐
│  LoginForm /    │
│  RegisterForm   │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
    ┌────▼────┐   ┌───▼────┐
    │ Google  │   │ Apple  │
    │ Button  │   │ Button │
    └────┬────┘   └───┬────┘
         │            │
         └──────┬─────┘
                │
         ┌──────▼──────┐
         │  useOAuth   │
         │    Hook     │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │   authApi   │
         │ (Backend)   │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │   Auth      │
         │  Context    │
         └─────────────┘
```

### OAuth Flow

1. **User clicks OAuth button** → Triggers `signInWithGoogle()` or `signInWithApple()`
2. **SDK popup opens** → User authenticates with provider
3. **Provider returns ID token** → Token contains user info
4. **Frontend calls backend** → Sends ID token to appropriate endpoint:
   - `/auth/google-login-event-user` or `/auth/google-register-event-user`
   - `/auth/apple-login-event-user` or `/auth/apple-register-event-user`
5. **Backend validates token** → Verifies with Google/Apple servers
6. **Backend returns JWT tokens** → Access token and refresh token
7. **Frontend stores tokens** → Saved in localStorage
8. **Frontend fetches user profile** → Gets full user data
9. **User is redirected** → To home page or callback URL

### Error Handling

The implementation includes comprehensive error handling:

- **SDK not loaded**: Buttons are disabled with loading state
- **Missing environment variables**: Console warnings and user-friendly error messages
- **Backend errors**: API error messages displayed via toast notifications
- **Network errors**: Generic error messages with retry capability
- **Token validation failures**: Proper error messages from backend

### Loading States

OAuth buttons show loading states during:
- SDK initialization
- Authentication popup flow
- Backend API calls
- Token storage and profile fetching

## Troubleshooting

### Google OAuth Issues

**Problem**: "Google Sign-In is not ready yet"
- **Solution**: Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Verify the Google SDK script is loading (check Network tab)
- Ensure the client ID is from a Web Application credential type

**Problem**: "Popup closed by user" or "Popup blocked"
- **Solution**: Ensure popups are not blocked in browser settings
- The popup must be triggered by a direct user action (click)

**Problem**: "Invalid origin" error
- **Solution**: Add your current domain to authorized JavaScript origins in Google Cloud Console
- For localhost, use `http://localhost:3000` (not `127.0.0.1`)

### Apple OAuth Issues

**Problem**: "Apple Sign-In is not ready yet"
- **Solution**: Check that `NEXT_PUBLIC_APPLE_CLIENT_ID` is set correctly
- Verify the Apple SDK script is loading

**Problem**: "The redirect URI provided is not valid"
- **Solution**: Ensure the redirect URI in .env.local exactly matches the one in Apple Developer Console
- Apple requires HTTPS for redirect URIs (except localhost)

**Problem**: Apple Sign-In doesn't work on localhost
- **Solution**: Apple Sign-In requires HTTPS
- Use ngrok or similar tunneling service for local development:
  ```bash
  ngrok http 3000
  ```
- Update `NEXT_PUBLIC_APPLE_REDIRECT_URI` to the ngrok URL

### General Issues

**Problem**: "Failed to [login/register] with [Google/Apple]"
- **Solution**: Check browser console for detailed error messages
- Verify backend endpoints are accessible
- Check that backend has proper Google/Apple token validation configured

**Problem**: User is not redirected after successful OAuth
- **Solution**: Check that `onSuccess` callback is properly set
- Verify router is working correctly
- Check for JavaScript errors in console

**Problem**: Tokens not being stored
- **Solution**: Check browser localStorage permissions
- Verify authApi.getProfile() is returning valid user data
- Check that backend is returning tokens in correct format

## Backend Requirements

Ensure your backend has implemented the following endpoints correctly:

### Event User Endpoints

- `POST /auth/google-login-event-user`
  - Request: `{ idToken: string, inviteToken?: string, inviteType?: 'collaborator' | 'ticket' }`
  - Response: `{ access_token: string, refresh_token: string }`

- `POST /auth/google-register-event-user`
  - Request: `{ idToken: string, inviteToken?: string, inviteType?: 'collaborator' | 'ticket' }`
  - Response: `{ access_token: string, refresh_token: string }`

- `POST /auth/apple-login-event-user`
  - Request: `{ idToken: string, inviteToken?: string, inviteType?: 'collaborator' | 'ticket' }`
  - Response: `{ access_token: string, refresh_token: string }`

- `POST /auth/apple-register-event-user`
  - Request: `{ idToken: string, inviteToken?: string, inviteType?: 'collaborator' | 'ticket' }`
  - Response: `{ access_token: string, refresh_token: string }`

The backend must:
1. Validate the ID token with Google/Apple
2. Extract user information (email, name, etc.)
3. Create or find user in database
4. Handle invite token linking if provided
5. Generate and return JWT tokens

## Security Considerations

1. **Never expose API keys**: Only use `NEXT_PUBLIC_*` variables for client-safe values
2. **Validate tokens on backend**: Always verify OAuth tokens server-side
3. **Use HTTPS in production**: Required for Apple, recommended for Google
4. **Implement CSRF protection**: Backend should validate request origins
5. **Rate limit OAuth endpoints**: Prevent abuse of authentication endpoints
6. **Rotate secrets regularly**: Update OAuth credentials periodically

## Additional Resources

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [Apple Sign-In Documentation](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Support

If you encounter issues not covered in this guide:
1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure backend endpoints are working
4. Check that OAuth credentials are configured correctly in provider consoles

# Google Authentication Implementation

This document explains how Google authentication has been implemented in the Livestock Manager app using Clerk.

## Setup Overview

1. **Clerk Dashboard Configuration**:
   - Native API has been enabled for the application
   - Google OAuth provider has been configured in the Clerk Dashboard
   - Android and iOS applications have been registered

2. **URL Scheme Configuration**:
   - The app scheme in app.json has been set to match the bundle ID/package name: `com.farmexpense.manager`
   - Deep linking is properly configured for OAuth authentication

3. **Client Implementation**:
   - ClerkProvider is configured with OAuth support
   - Login and register screens have Google authentication buttons
   - Deep linking is handled using Expo's WebBrowser

## How Google Auth Works

1. **User Flow**:
   - User taps "Continue with Google" on the login or register screen
   - The app initiates OAuth flow using Clerk's `startOAuthFlow` function
   - User is redirected to a web browser to select their Google account
   - After selection, user is redirected back to the app
   - Clerk creates or retrieves the user's account
   - User is logged in and redirected to the main app

2. **Technical Flow**:
   - The `useOAuth` hook is used to access the `startOAuthFlow` function
   - Deep linking is managed through Expo's WebBrowser
   - Clerk handles token exchange and session creation
   - The app redirects the user to the home screen upon successful authentication

## Required Packages

```json
"dependencies": {
  "@clerk/clerk-expo": "^0.19.0",
  "expo-web-browser": "~12.3.2",
  "expo-secure-store": "~12.3.1"
}
```

## Code Implementation

### 1. ClerkProvider Configuration (app/_layout.tsx)

```typescript
<ClerkProvider 
  publishableKey={clerkPubKey}
  tokenCache={tokenCache}
  redirectUrl={getRedirectUrl()}
  oauthCallback={(result) => {
    console.log('OAuth callback result:', result);
  }}
>
  {/* App content */}
</ClerkProvider>
```

### 2. Google Sign-In Button (app/(auth)/login.tsx)

```typescript
const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

const handleGoogleLogin = useCallback(async () => {
  try {
    setLoading(true);
    const { createdSessionId, setActive } = await startOAuthFlow();
    
    if (createdSessionId) {
      await setActive({ session: createdSessionId });
      router.replace('/(tabs)');
    }
  } catch (err) {
    console.error("OAuth error", err);
    Alert.alert("Error signing in with Google", "Please try again");
  } finally {
    setLoading(false);
  }
}, [startOAuthFlow]);
```

## Troubleshooting

If you encounter issues with Google authentication:

1. **Native API Access**:
   - Verify that the Native API is enabled in the Clerk Dashboard
   - Ensure your package name/bundle ID matches what's registered in Clerk

2. **Deep Linking**:
   - Confirm your app scheme matches your package name/bundle ID
   - Check the `redirectUrl` configuration in ClerkProvider

3. **Android Issues**:
   - Make sure the correct Android package name is registered in Clerk
   - Verify the SHA certificate fingerprints if required

4. **General Issues**:
   - Check the console logs for OAuth callback results
   - Verify that your Clerk publishable key is correct
   - Ensure Expo WebBrowser is properly initialized

## Resources

- [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections/oauth)
- [Expo WebBrowser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Deep Linking Guide](https://docs.expo.dev/guides/deep-linking/) 
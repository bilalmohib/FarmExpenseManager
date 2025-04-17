# Implementing Clerk Authentication in the Livestock Manager App

This README explains how Clerk authentication has been integrated into the Livestock Manager App.

## Setup Steps

1. Install the required packages:
   ```bash
   npm install @clerk/clerk-expo expo-secure-store
   ```

2. Create a `.env` file in the root of your project with your Clerk publishable key:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVhZHktaGFkZG9jay01OC5jbGVyay5hY2NvdW50cy5kZXYk
   ```

3. Set up a secure token cache using `expo-secure-store` in `app/lib/clerk-token-cache.ts`.

## Files Structure

### Core Authentication Files

- `app/_layout.tsx` - Root layout with Clerk Provider setup
- `app/lib/clerk-token-cache.ts` - Secure token cache implementation
- `app/(auth)/_layout.tsx` - Auth layout to handle authenticated/unauthenticated routes
- `app/(auth)/login.tsx` - Login screen with email/password authentication
- `app/(auth)/register.tsx` - Registration screen with email verification flow
- `app/components/SignOutButton.tsx` - Reusable sign-out button component

## Authentication Flow

1. **User Registration**:
   - User enters name, email, and password
   - Clerk creates the account
   - Verification code is sent to user's email
   - User verifies email by entering the code
   - User session is created and set as active

2. **User Login**:
   - User enters email and password
   - Clerk authenticates the credentials
   - User session is created and set as active

3. **Authentication State Management**:
   - The `ClerkProvider` maintains the auth state throughout the app
   - `useAuth()` hook from Clerk is used to check if a user is signed in
   - Protected routes redirect users to login if not authenticated

4. **Sign Out**:
   - `SignOutButton` component provides a way to sign out
   - When clicked, Clerk ends the user's session

## Implementation Details

### ClerkProvider Setup

The `ClerkProvider` is set up in the root layout file (`app/_layout.tsx`) to provide authentication context to all screens:

```tsx
return (
  <ClerkProvider 
    publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    tokenCache={tokenCache}
  >
    <StatusBar style="auto" />
    <Stack screenOptions={{ headerShown: false }}>
      {/* Navigation screens */}
    </Stack>
  </ClerkProvider>
);
```

### Authentication State Check

The `useAuth` hook is used to check if a user is authenticated:

```tsx
const { isSignedIn, isLoaded } = useAuth();

if (!isLoaded) {
  return null; // Or a loading indicator
}

if (isSignedIn) {
  return <Redirect href="/(tabs)" />;
}
```

### User Data Access

The `useUser` hook provides access to the user's information:

```tsx
const { user, isLoaded } = useUser();
const userName = user?.firstName || user?.username || 'Farmer';
```

## Migrating from Firebase

This implementation replaces the previous Firebase authentication. The main differences are:

1. **Provider**: Using `ClerkProvider` instead of `AuthProvider`
2. **Auth Hooks**: Using Clerk's `useAuth` and `useUser` hooks
3. **Sign In/Up Methods**: Using Clerk's `useSignIn` and `useSignUp` hooks
4. **Session Management**: Clerk handles sessions differently

## Next Steps

1. **Complete installation** of required packages when able
2. **Set up your Clerk application** in the Clerk Dashboard
3. **Enable Native API** in the Clerk Dashboard
4. **Update routing paths** to handle navigation correctly
5. **Add social login options** for alternative authentication methods

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Expo Guide](https://clerk.com/docs/quickstarts/expo)
- [Clerk Authentication API](https://clerk.com/docs/reference/authentication-api) 
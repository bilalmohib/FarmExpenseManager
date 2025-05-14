// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { useSignUp, useOAuth } from '@clerk/clerk-expo';
// import * as WebBrowser from 'expo-web-browser';
// import GoogleButton from '../components/GoogleButton';

// export default function RegisterScreen() {
//   const [fullName, setFullName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [secureTextEntry, setSecureTextEntry] = useState(true);
//   const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
//   const [pendingVerification, setPendingVerification] = useState(false);
//   const [verificationCode, setVerificationCode] = useState('');
  
//   const router = useRouter();
//   const { isLoaded, signUp, setActive } = useSignUp();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleRegister = async () => {
//     // Validate inputs
//     if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
//       Alert.alert('Validation Error', 'Please fill in all fields');
//       return;
//     }

//     if (!validateEmail(email)) {
//       Alert.alert('Validation Error', 'Please enter a valid email address');
//       return;
//     }

//     if (password.length < 8) {
//       Alert.alert('Validation Error', 'Password must be at least 8 characters long');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Validation Error', 'Passwords do not match');
//       return;
//     }

//     try {
//       setLoading(true);
//       if (!signUp) {
//         throw new Error('signUp is not loaded');
//       }
      
//       // Create a new user
//       await signUp.create({
//         emailAddress: email.trim(),
//         password,
//         firstName: fullName.split(' ')[0],
//         lastName: fullName.split(' ').slice(1).join(' ') || '',
//       });

//       // Send verification email
//       await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
//       // Switch to verification mode
//       setPendingVerification(true);
//     } catch (error: any) {
//       let errorMessage = 'An error occurred during registration';
      
//       // Handle Clerk-specific error codes
//       if (error.errors && error.errors.length > 0) {
//         errorMessage = error.errors[0].message || errorMessage;
//       }
      
//       Alert.alert('Registration Failed', errorMessage);
//       console.error('Registration error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyEmail = async () => {
//     if (!verificationCode.trim()) {
//       Alert.alert('Validation Error', 'Please enter the verification code');
//       return;
//     }

//     try {
//       setLoading(true);
//       if (!signUp) {
//         throw new Error('signUp is not loaded');
//       }
      
//       // Attempt to verify the email address
//       const verification = await signUp.attemptEmailAddressVerification({
//         code: verificationCode,
//       });

//       if (verification.status === 'complete') {
//         // Set the user session as active if verification is complete
//         await setActive({ session: verification.createdSessionId });
//         Alert.alert('Success', 'Your account has been created successfully');
//         router.replace('/(tabs)');
//       } else {
//         Alert.alert('Verification Error', 'Email verification failed. Please try again.');
//       }
//     } catch (error: any) {
//       let errorMessage = 'Email verification failed';
      
//       // Handle Clerk-specific error codes
//       if (error.errors && error.errors.length > 0) {
//         errorMessage = error.errors[0].message || errorMessage;
//       }
      
//       Alert.alert('Verification Failed', errorMessage);
//       console.error('Verification error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleLoginInstead = () => {
//     router.push('/(auth)/login');
//   };

//   const handleGoogleSignUp = useCallback(async () => {
//     try {
//       setLoading(true);
//       const { createdSessionId, setActive } = await startOAuthFlow();
//       if (createdSessionId) {
//         if (setActive) {
//           await setActive({ session: createdSessionId });
//           router.replace('/(tabs)');
//         } else {
//           console.error("setActive is undefined");
//         }
//       }
//     } catch (err) {
//       console.error("OAuth error", err);
//       Alert.alert("Error signing up with Google", "Please try again");
//     } finally {
//       setLoading(false);
//     }
//   }, [startOAuthFlow]);

//   // If we're waiting for verification, show the verification form
//   if (pendingVerification) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.verificationContainer}>
//           <Ionicons name="mail" size={60} color="#27ae60" style={styles.verificationIcon} />
//           <Text style={styles.verificationTitle}>Verify your email</Text>
//           <Text style={styles.verificationSubtitle}>
//             We've sent a verification code to {email}. Please check your inbox and enter the code below.
//           </Text>
          
//           <TextInput
//             style={styles.verificationInput}
//             placeholder="Verification code"
//             placeholderTextColor="#95a5a6"
//             value={verificationCode}
//             onChangeText={setVerificationCode}
//             keyboardType="number-pad"
//             editable={!loading}
//             maxLength={6}
//           />
          
//           <TouchableOpacity
//             style={styles.verifyButton}
//             onPress={handleVerifyEmail}
//             disabled={loading || !verificationCode.trim()}
//             {loading ? (
  //           >
  //               <ActivityIndicator color="#fff" />
  //             ) : (
//               <Text style={styles.verifyButtonText}>Verify Email</Text>
//             )}
//           </TouchableOpacity>
          
//           <Text style={styles.resendText}>
//             Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
//           </Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.logoContainer}>
//           <Ionicons name="leaf-outline" size={80} color="#27ae60" style={styles.logo} />
//           <Text style={styles.title}>Create Account</Text>
//           <Text style={styles.subtitle}>Join Livestock Manager</Text>
//         </View>

//         <View style={styles.formContainer}>
//           <View style={styles.inputContainer}>
//             <Ionicons name="person-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Full Name"
//               placeholderTextColor="#95a5a6"
//               value={fullName}
//               onChangeText={setFullName}
//               autoCapitalize="words"
//               editable={!loading}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Ionicons name="mail-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Email"
//               placeholderTextColor="#95a5a6"
//               value={email}
//               onChangeText={setEmail}
//               autoCapitalize="none"
//               keyboardType="email-address"
//               editable={!loading}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               placeholderTextColor="#95a5a6"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry={secureTextEntry}
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.eyeIcon}
//               onPress={() => setSecureTextEntry(!secureTextEntry)}
//             >
//               <Ionicons
//                 name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
//                 size={22}
//                 color="#7f8c8d"
//               />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.inputContainer}>
//             <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Confirm Password"
//               placeholderTextColor="#95a5a6"
//               value={confirmPassword}
//               onChangeText={setConfirmPassword}
//               secureTextEntry={confirmSecureTextEntry}
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.eyeIcon}
//               onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
//             >
//               <Ionicons
//                 name={confirmSecureTextEntry ? "eye-outline" : "eye-off-outline"}
//                 size={22}
//                 color="#7f8c8d"
//               />
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.policyText}>
//             By registering, you agree to our <Text style={styles.policyLink}>Terms of Service</Text> and <Text style={styles.policyLink}>Privacy Policy</Text>
//           </Text>

//           <TouchableOpacity
//             style={[
//               styles.registerButton,
//               (!fullName.trim() || !email.trim() || !password || !confirmPassword) && styles.registerButtonDisabled
//             ]}
//             onPress={handleRegister}
//             disabled={loading || !fullName.trim() || !email.trim() || !password || !confirmPassword || !isLoaded}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.registerButtonText}>Create Account</Text>
//             )}
//           </TouchableOpacity>

//           <View style={styles.orContainer}>
//             <View style={styles.divider} />
//             <Text style={styles.orText}>OR</Text>
//             <View style={styles.divider} />
//           </View>

//           <GoogleButton 
//             onPress={handleGoogleSignUp}
//             loading={loading}
//             text="Sign up with Google"
//           />

//           <View style={styles.loginContainer}>
//             <Text style={styles.loginText}>Already have an account?</Text>
//             <TouchableOpacity onPress={handleLoginInstead}>
//               <Text style={styles.loginLink}>Login</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f7f9fc',
//   },
//   scrollContent: {
//     flexGrow: 1,
//     padding: 20,
//     paddingTop: 40,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   logo: {
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 5,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//   },
//   formContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderColor: '#e0e0e0',
//     marginBottom: 20,
//   },
//   inputIcon: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     color: '#2c3e50',
//     fontSize: 16,
//   },
//   eyeIcon: {
//     padding: 10,
//   },
//   policyText: {
  //     fontSize: 12,
//     color: '#7f8c8d',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   policyLink: {
//     color: '#3498db',
//     fontWeight: '500',
//   },
//   registerButton: {
//     backgroundColor: '#27ae60',
//     borderRadius: 8,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   registerButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   registerButtonDisabled: {
//     backgroundColor: '#95a5a6',
//   },
//   loginContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 15,
//   },
//   loginText: {
//     color: '#7f8c8d',
//     fontSize: 14,
//   },
//   loginLink: {
//     color: '#3498db',
//     fontWeight: 'bold',
//     fontSize: 14,
//     marginLeft: 5,
//   },
//   // Verification styles
//   verificationContainer: {
//     flex: 1,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   verificationIcon: {
//     marginBottom: 20,
//   },
//   verificationTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 10,
//   },
//   verificationSubtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     marginBottom: 30,
//   },
//   verificationInput: {
//     width: '100%',
//     height: 60,
//     backgroundColor: '#f0f2f5',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     textAlign: 'center',
//     letterSpacing: 5,
//     marginBottom: 20,
//   },
//   verifyButton: {
//     backgroundColor: '#27ae60',
//     borderRadius: 8,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     marginBottom: 15,
//   },
//   verifyButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   resendText: {
//     color: '#7f8c8d',
//     fontSize: 14,
//   },
//   resendLink: {
//     color: '#3498db',
//     fontWeight: 'bold',
//   },
//   orContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 15,
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#e0e0e0',
//   },
//   orText: {
//     marginHorizontal: 10,
//     color: '#7f8c8d',
//     fontSize: 14,
//   },
// }); 

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential 
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Initialize WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);

  const router = useRouter();

  // Setup Google OAuth - replace with your own client IDs
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: 'YOUR_CLIENT_ID',
  //   iosClientId: 'YOUR_IOS_CLIENT_ID',
  //   androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  //   webClientId: 'YOUR_WEB_CLIENT_ID',
  // });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Save user data to Firestore
  const saveUserToFirestore = async (userId: string, userData: any) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
      console.log('User data saved to Firestore');
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Save additional user data to Firestore
      const firstName = fullName.split(' ')[0];
      const lastName = fullName.split(' ').slice(1).join(' ') || '';
      
      await saveUserToFirestore(user.uid, {
        email: email.trim(),
        firstName,
        lastName,
        fullName: fullName.trim(),
        emailVerified: false,
        role: 'user',
      });
      
      // Notify user to verify email
      setPendingVerification(true);
      
    } catch (error) {
      let errorMessage = 'An error occurred during registration';
      
      // Handle Firebase-specific error codes
      if (error instanceof Error && 'code' in error) {
        const errorCode = error.code as string;
        if (errorCode === 'auth/email-already-in-use') {
          errorMessage = 'This email is already in use';
        } else if (errorCode === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (errorCode === 'auth/weak-password') {
          errorMessage = 'Password is too weak';
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
      router.push('/(auth)/login');
    }
  };

  // const handleGoogleSignUp = async () => {
  //   try {
  //     setLoading(true);
      
  //     // Prompt the user to authenticate with Google
  //     const result = await promptAsync();
      
  //     if (result.type === 'success') {
  //       // Get the access token
  //       const { id_token } = result.params;
        
  //       // Create a Google credential with the token
  //       const credential = GoogleAuthProvider.credential(id_token);
        
  //       // Sign in with the credential
  //       const userCredential = await signInWithCredential(auth, credential);
  //       const user = userCredential.user;
        
  //       // Check if this is a new user (no Firestore record)
  //       // If new, save user data to Firestore
  //       await saveUserToFirestore(user.uid, {
  //         email: user.email,
  //         firstName: user.displayName ? user.displayName.split(' ')[0] : '',
  //         lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
  //         fullName: user.displayName || '',
  //         emailVerified: user.emailVerified,
  //         role: 'user',
  //         photoURL: user.photoURL || null,
  //       });
        
  //       // Navigate to the main app
  //       Alert.alert('Success', 'You have been successfully registered!');
  //       router.replace('/(tabs)');
  //     }
  //   } catch (error) {
  //     console.error('Google Sign Up Error:', error);
  //     Alert.alert('Error', 'Failed to sign up with Google');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleLoginInstead = () => {
    router.push('/(auth)/login');
  };

  // If we're waiting for verification, show the verification form
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.verificationContainer}>
          <Ionicons name="mail" size={60} color="#27ae60" style={styles.verificationIcon} />
          <Text style={styles.verificationTitle}>Verify your email</Text>
          <Text style={styles.verificationSubtitle}>
            We've sent a verification email to {email}. Please check your inbox and verify your email address.
          </Text>
          
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => {
              // Sign out the user so they need to sign in again after verification
              auth.signOut();
              router.push('/(auth)/login');
            }}
          >
            <Text style={styles.verifyButtonText}>Go to Login</Text>
          </TouchableOpacity>
          
          <Text style={styles.resendText}>
            Didn't receive the email? 
            <TouchableOpacity 
              onPress={async () => {
                try {
                  if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                    Alert.alert('Success', 'Verification email resent');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to resend verification email');
                }
              }}
            >
              <Text style={styles.resendLink}> Resend</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf-outline" size={80} color="#27ae60" style={styles.logo} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Livestock Manager</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#95a5a6"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#95a5a6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#95a5a6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            >
              <Ionicons
                name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#7f8c8d"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#95a5a6"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={confirmSecureTextEntry}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
            >
              <Ionicons
                name={confirmSecureTextEntry ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#7f8c8d"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.policyText}>
            By registering, you agree to our <Text style={styles.policyLink}>Terms of Service</Text> and <Text style={styles.policyLink}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (!fullName.trim() || !email.trim() || !password || !confirmPassword) && styles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading || !fullName.trim() || !email.trim() || !password || !confirmPassword}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            // onPress={handleGoogleSignUp}
            disabled={loading || !Request}
          >
            {loading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                </View>
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity> */}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLoginInstead}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#2c3e50',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  policyText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  policyLink: {
    color: '#3498db',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginLink: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  // Verification styles
  verificationContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationIcon: {
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  resendLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  // Google button styles
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
});
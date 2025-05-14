import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Define types for our auth context
type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Define props for auth provider
type AuthProviderProps = {
  children: ReactNode;
};

// Create the auth provider
export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // When Firebase auth changes, sync with our backend
        handleAuthSync(user);
      } else {
        // When user logs out of Firebase, clear local user data
        queryClient.setQueryData(["/api/user"], null);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Sync Firebase auth with our backend
  const handleAuthSync = async (firebaseUser: FirebaseUser) => {
    try {
      // Get ID token from Firebase user
      const idToken = await firebaseUser.getIdToken();
      
      // Send to our backend to create/update user and get session
      const response = await apiRequest("POST", "/api/auth/firebase-login", { 
        idToken,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid
      });
      
      // Get user data from response and update cache directly
      const userData = await response.json();
      
      // Only update the cache if we got a valid user object
      if (userData && typeof userData === 'object' && 'id' in userData) {
        queryClient.setQueryData(["/api/user"], userData);
      }
      
      // Also invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      console.log("Auth sync successful, user data:", userData);
    } catch (error) {
      console.error("Error syncing auth:", error);
      toast({
        title: "Authentication error",
        description: "Failed to synchronize your account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get current user from backend
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!firebaseUser, // Only fetch user data when Firebase user is available
    // Make sure undefined result is converted to null to match type
    select: (data) => data || null
  });

  // Register with email and password
  const registerWithEmail = async (email: string, username: string, password: string) => {
    try {
      // Create user in Firebase
      const firebaseUser = await signUpWithEmail(email, password);
      
      // Sync with our backend (includes registration data)
      await apiRequest("POST", "/api/auth/register", {
        email,
        username,
        password,
        providerId: firebaseUser.uid,
        provider: "firebase",
        displayName: username,
      });
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Login with email and password
  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      console.log("Starting Google login...");
      const user = await signInWithGoogle();
      console.log("Google login successful:", user?.email);
      
      // Show success message
      toast({
        title: "Google login successful",
        description: "Redirecting to your dashboard...",
      });
      
      // Try to directly set the user in the query cache
      // This might help with UI updates when the handleAuthSync hasn't completed yet
      if (user) {
        // Creating a partial user object that satisfies the required User type
        // We'll let the real user data come from backend sync
        console.log("Firebase auth successful, waiting for backend sync...");
        /* Removing direct cache update as it's causing type errors
        const userData = {
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
          id: -1,
          username: user.email?.split('@')[0] || 'user',
          provider: 'firebase',
          providerId: user.uid,
          password: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Update UI immediately while backend syncs
        queryClient.setQueryData(["/api/user"], userData);
        */
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      await signOut();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, set, get, runTransaction } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, communityId: string, country: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userRef = ref(db, `people/${user.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserRole(userData.role);

            if (user.emailVerified && !userData.emailVerified) {
              // Update email verification status
              await set(ref(db, `people/${user.uid}/emailVerified`), true);

              // Update community member count and country assignment
              if (userData.community && !userData.memberCountUpdated) {
                const communityRef = ref(db, `communities/${userData.community.id}`);
                await runTransaction(communityRef, (community) => {
                  if (community) {
                    community.currentCount = (community.currentCount || 0) + 1;
                    if (community.countries) {
                      community.countries[userData.community.country] = user.uid;
                    }
                  }
                  return community;
                });

                // Create profile
                await set(ref(db, `profile/${user.uid}`), {
                  name: userData.name,
                  email: user.email,
                  community: userData.community.id,
                  country: userData.community.country,
                  createdAt: Date.now()
                });

                await set(ref(db, `people/${user.uid}/memberCountUpdated`), true);
              }

              toast.success('Email verified successfully!');
            }
          }
        } catch (error) {
          console.error('Error checking user data:', error);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      if (!user.emailVerified) {
        await signOut();
        throw new Error('Please verify your email before logging in');
      }

      const userRef = ref(db, `people/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User data not found');
      }

      const userData = snapshot.val();
      
      if (userData.hash !== user.uid) {
        throw new Error('Invalid authentication');
      }

      setUserRole(userData.role);
      navigate(userData.role === 'admin' ? '/admin' : '/profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string, communityId: string, country: string) => {
    try {
      // Verify community and country availability
      const communityRef = ref(db, `communities/${communityId}`);
      const communitySnapshot = await get(communityRef);
      
      if (!communitySnapshot.exists()) {
        throw new Error('Community not found');
      }

      const communityData = communitySnapshot.val();
      
      // Check if the country is available
      if (!communityData.countries || communityData.countries[country] !== '') {
        throw new Error('Selected country is no longer available');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Send verification email
      await sendEmailVerification(user);

      // Create user profile with hash (UID)
      await set(ref(db, `people/${user.uid}`), {
        name,
        email,
        role: 'user',
        hash: user.uid,
        emailVerified: false,
        memberCountUpdated: false,
        community: {
          id: communityId,
          country
        },
        createdAt: Date.now()
      });

      toast.success('Verification email sent. Please check your inbox.');
      navigate('/login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already registered');
      }
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserRole(null);
    navigate('/');
  };

  const value = {
    user,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
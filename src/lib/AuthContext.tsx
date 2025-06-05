import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.photoURL,
      }
    });
    
    if (error) throw error;
  };

  const updateUserEmail = async (email: string) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase.auth.updateUser({
      email: email
    });
    
    if (error) throw error;
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    // First verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    
    if (signInError) throw new Error('Current password is incorrect');

    // Then update to the new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  };

  const deleteUserAccount = async () => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    
    await signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      updateUserProfile,
      updateUserEmail,
      updateUserPassword,
      deleteUserAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
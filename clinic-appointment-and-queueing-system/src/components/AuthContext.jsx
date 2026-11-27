import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getProfile, onAuthStateChange, signOut } from "../data/auth";
import { supabase } from "../data/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and associated profile
  async function loadUserProfile(currentUser) {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(currentUser);

    try {
      const { data, error } = await getProfile(currentUser.id);
      if (data) {
        setProfile(data);
      } else {
        // Self-heal: If user exists in auth.users but has no row in public.profiles yet
        const meta = currentUser.user_metadata || {};
        const autoProfile = {
          user_id: currentUser.id,
          full_name: meta.full_name || currentUser.email?.split("@")[0] || "User",
          mobile_no: meta.mobile_no || "",
          email: currentUser.email,
          role: meta.role || "patient",
          is_active: true,
        };

        const { data: created } = await supabase
          .from("profiles")
          .insert(autoProfile)
          .select()
          .maybeSingle();

        setProfile(created || autoProfile);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfile({ role: "patient", full_name: currentUser.email });
    } finally {
      setLoading(false);
    }
  }

  // Refresh profile ensuring we always get the live user
  async function refreshProfile(explicitUser) {
    setLoading(true);
    let targetUser = explicitUser;
    if (!targetUser) {
      const { user: curUser } = await getCurrentUser();
      targetUser = curUser;
    }
    await loadUserProfile(targetUser);
  }

  useEffect(() => {
    // 1. Initial check
    getCurrentUser().then(({ user }) => {
      loadUserProfile(user);
    });

    // 2. Listen to live Supabase auth state changes
    const subscription = onAuthStateChange((session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    role: profile?.role || "patient",
    loading,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

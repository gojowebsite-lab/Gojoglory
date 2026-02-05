'use client';

import { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';

export interface Profile {
  id: string;
  username: string;
  role: 'user' | 'admin';
  basic_credits: number;
  premium_credits: number;
  max_groups: number;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Use a listener for profile updates
        const profileRef = ref(database, `profiles/${firebaseUser.uid}`);
        const unsubscribeProfile = onValue(profileRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setProfile({ ...data, id: firebaseUser.uid } as Profile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  async function refreshProfile() {
    if (!user) return;
    const profileRef = ref(database, `profiles/${user.uid}`);
    const snapshot = await get(profileRef);
    const data = snapshot.val();
    if (data) {
      setProfile({ ...data, id: user.uid } as Profile);
    }
  }

  return { user, profile, loading, refreshProfile };
}

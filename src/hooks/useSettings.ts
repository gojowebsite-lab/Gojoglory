import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export interface WebsiteSettings {
  name: string;
  logo_url: string;
  whatsapp_link: string;
  telegram_link: string;
  whatsapp_enabled: boolean;
  telegram_enabled: boolean;
}

const defaultSettings: WebsiteSettings = {
  name: 'FFGlory',
  logo_url: '',
  whatsapp_link: '',
  telegram_link: '',
  whatsapp_enabled: true,
  telegram_enabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(database, 'settings/website');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.val() });
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}

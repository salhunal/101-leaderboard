"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT = { appName: "101 Leaderboard", accentColor: "#6366f1" };

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "settings"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function saveSettings(data) {
    await setDoc(doc(db, "config", "settings"), data, { merge: true });
  }

  return { settings, loading, saveSettings };
}

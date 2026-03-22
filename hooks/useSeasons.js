"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useSeasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "seasons"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSeasons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function addSeason(name) {
    await addDoc(collection(db, "seasons"), { name, createdAt: Date.now() });
  }

  return { seasons, loading, addSeason };
}

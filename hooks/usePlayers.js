"use client";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function addPlayer(name) {
    await addDoc(collection(db, "players"), {
      name,
      createdAt: Date.now(),
    });
  }

  async function removePlayer(id) {
    await deleteDoc(doc(db, "players", id));
  }

  return { players, loading, addPlayer, removePlayer };
}

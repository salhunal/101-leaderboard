"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

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
    await addDoc(collection(db, "players"), { name, createdAt: Date.now(), photoURL: null });
  }

  async function removePlayer(id) {
    await deleteDoc(doc(db, "players", id));
  }

  async function uploadPlayerPhoto(playerId, file) {
    const storageRef = ref(storage, `players/${playerId}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "players", playerId), { photoURL: url });
    return url;
  }

  async function removePlayerPhoto(playerId) {
    try {
      await deleteObject(ref(storage, `players/${playerId}`));
    } catch {}
    await updateDoc(doc(db, "players", playerId), { photoURL: null });
  }

  return { players, loading, addPlayer, removePlayer, uploadPlayerPhoto, removePlayerPhoto };
}

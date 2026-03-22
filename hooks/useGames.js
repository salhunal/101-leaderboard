"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useGames(seasonId = null) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (seasonId) {
      q = query(collection(db, "games"), where("seasonId", "==", seasonId), orderBy("date", "desc"));
    } else {
      q = query(collection(db, "games"), orderBy("date", "desc"));
    }
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [seasonId]);

  return { games, loading };
}

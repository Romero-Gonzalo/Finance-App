"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";

export function useMe() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setMe(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { me, loading };
}

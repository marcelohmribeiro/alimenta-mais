import { auth } from "@/services";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });

    return unsub;
  }, []);

  return { user, initializing };
};

export default useAuth;

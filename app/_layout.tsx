import "@/styles/global.css";
import { LoadingProvider } from "@/components/_loading";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import useAuth from "@/hooks/_useAuth";
import { verificarSeUsuarioEhDoador } from "@/services";
import { useUser } from "@/store";
import { Slot } from "expo-router";
import { useEffect } from "react";

function UserProfileWatcher() {
  const { user, initializing } = useAuth();
  const { setIsDoador, reset } = useUser();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      reset();
      return;
    }
    reset();
    verificarSeUsuarioEhDoador(user.uid).then(setIsDoador);
  }, [user?.uid, initializing, setIsDoador, reset]);

  return null;
}

const RootLayout = () => {
  return (
    <GluestackUIProvider mode="dark">
      <LoadingProvider>
        <UserProfileWatcher />
        <Slot />
      </LoadingProvider>
    </GluestackUIProvider>
  );
};

export default RootLayout;

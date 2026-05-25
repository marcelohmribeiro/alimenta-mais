import "@/styles/global.css";
import { LoadingProvider } from "@/components/_loading";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Slot } from "expo-router";

const RootLayout = () => {
  return (
    <GluestackUIProvider mode="dark">
      <LoadingProvider>
        <Slot />
      </LoadingProvider>
    </GluestackUIProvider>
  );
};

export default RootLayout;

import { useLoading } from "@/store";
import { Image as MotiImage } from "moti";
import { memo, useEffect, useState } from "react";
import { Text, View } from "react-native";

type LoadingDotsProps = {
  className?: string;
  text?: string;
};

type LoadingProviderProps = {
  children: React.ReactNode;
};

const AnimatedLogo = memo(function AnimatedLogo() {
  return (
    <MotiImage
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: "timing", duration: 800 }}
      style={{ width: 104, height: 104 }}
      source={require("@/assets/images/Alimenta-logo.png")}
    />
  );
});

export const LoadingDots = memo(function LoadingDots({ className, text }: LoadingDotsProps) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <Text className={className}>
      {text ?? "Carregando dados"}
      {dots}
    </Text>
  );
});

const Loading = memo(function Loading() {
  const loading = useLoading((s) => s.loading);
  if (loading === 0) return null;
  return (
    <View
      className="flex h-full w-full items-center justify-center"
      style={{ position: "absolute", zIndex: 9999 }}
    >
      <View
        className="p-3 flex justify-center items-center h-full w-full gap-3"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        <AnimatedLogo />
        <LoadingDots className="text-white text-base" />
      </View>
    </View>
  );
});

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  return (
    <View className="w-full h-full">
      <Loading />
      {children}
    </View>
  );
};

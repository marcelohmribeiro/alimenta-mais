export * from "./termos";

export const impactMetrics = [
  { icon: "gift-outline", value: "28", label: "doações feitas" },
  { icon: "leaf", value: "126 kg", label: "alimentos doados" },
  { icon: "account-group-outline", value: "63", label: "pessoas ajudadas" },
] as const;

export const menuItems = [
  {
    icon: "shield-check-outline",
    title: "Termos de uso e privacidade",
    subtitle: "Consulte as regras da plataforma",
    route: "/(auth)/terms",
  },
] as const;

export const absoluteFill = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
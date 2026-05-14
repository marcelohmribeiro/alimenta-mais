export const impactMetrics = [
  { icon: "gift-outline", value: "28", label: "doações feitas" },
  { icon: "leaf", value: "126 kg", label: "alimentos doados" },
  { icon: "account-group-outline", value: "63", label: "pessoas ajudadas" },
] as const;

export const menuItems = [
  {
    icon: "gift-outline",
    title: "Minhas doações",
    subtitle: "Histórico de alimentos doados",
    route: undefined,
  },
  {
    icon: "archive-outline",
    title: "Minhas solicitações",
    subtitle: "Acompanhe suas solicitações",
    route: undefined,
  },
  {
    icon: "map-marker-outline",
    title: "Endereços salvos",
    subtitle: "Gerencie seus endereços",
    route: undefined,
  },
  {
    icon: "heart-outline",
    title: "Favoritos",
    subtitle: "Alimentos e doadores favoritados",
    route: undefined,
  },
  {
    icon: "star-outline",
    title: "Avaliações",
    subtitle: "Avalie doações e doadores",
    route: undefined,
  },
  {
    icon: "help-circle-outline",
    title: "Central de ajuda",
    subtitle: "Dúvidas frequentes e suporte",
    route: undefined,
  },
  {
    icon: "information-outline",
    title: "Sobre o Alimenta+",
    subtitle: "Saiba mais sobre o app",
    route: undefined,
  },
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
import { absoluteFill } from "@/constants";
import useAuth from "@/hooks/_useAuth";
import { db } from "@/services";
import { UserProfile } from "@/types";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SolicitacaoStatus = "pendente" | "aceita" | "recusada";

type SolicitacaoMock = {
  id: string;
  doacaoId: string;
  doacaoTitulo: string;
  doacaoQuantidade: string;
  doacaoValidade: string;
  doacaoCategoria: string;
  doacaoImagem: any;
  solicitanteNome: string;
  solicitanteAvatar: string | null;
  solicitanteDoacoesRecebidas: number;
  distancia: string;
  solicitadoEm: string;
  status: SolicitacaoStatus;
};

const fallbackImage = require("@/assets/images/pao.jpg");

const SOLICITACOES_MOCK: SolicitacaoMock[] = [
  {
    id: "sol-001",
    doacaoId: "doc-101",
    doacaoTitulo: "Pão francês fresquinho",
    doacaoQuantidade: "2 kg",
    doacaoValidade: "Hoje, 22:00",
    doacaoCategoria: "Pães",
    doacaoImagem: fallbackImage,
    solicitanteNome: "Maria Silva",
    solicitanteAvatar: null,
    solicitanteDoacoesRecebidas: 12,
    distancia: "1,2 km de você",
    solicitadoEm: "há 15 min",
    status: "pendente",
  },
  {
    id: "sol-002",
    doacaoId: "doc-101",
    doacaoTitulo: "Pão francês fresquinho",
    doacaoQuantidade: "2 kg",
    doacaoValidade: "Hoje, 22:00",
    doacaoCategoria: "Pães",
    doacaoImagem: fallbackImage,
    solicitanteNome: "João Pereira",
    solicitanteAvatar: null,
    solicitanteDoacoesRecebidas: 5,
    distancia: "3,4 km de você",
    solicitadoEm: "há 42 min",
    status: "pendente",
  },
  {
    id: "sol-003",
    doacaoId: "doc-102",
    doacaoTitulo: "Cesta de frutas variadas",
    doacaoQuantidade: "5 kg",
    doacaoValidade: "Amanhã, 18:00",
    doacaoCategoria: "Frutas",
    doacaoImagem: fallbackImage,
    solicitanteNome: "Ana Costa",
    solicitanteAvatar: null,
    solicitanteDoacoesRecebidas: 27,
    distancia: "850 m de você",
    solicitadoEm: "há 2 h",
    status: "aceita",
  },
  {
    id: "sol-004",
    doacaoId: "doc-103",
    doacaoTitulo: "Marmitas prontas",
    doacaoQuantidade: "10 unidades",
    doacaoValidade: "Hoje, 20:00",
    doacaoCategoria: "Prontos",
    doacaoImagem: fallbackImage,
    solicitanteNome: "Carlos Oliveira",
    solicitanteAvatar: null,
    solicitanteDoacoesRecebidas: 3,
    distancia: "5,1 km de você",
    solicitadoEm: "há 5 h",
    status: "recusada",
  },
];

const STATUS_FILTERS: { label: string; value: "todas" | SolicitacaoStatus }[] = [
  { label: "Todas", value: "todas" },
  { label: "Pendentes", value: "pendente" },
  { label: "Aceitas", value: "aceita" },
  { label: "Recusadas", value: "recusada" },
];

const statusBadge: Record<
  SolicitacaoStatus,
  { label: string; bg: string; color: string; icon: string }
> = {
  pendente: {
    label: "Pendente",
    bg: "rgba(234,179,8,0.12)",
    color: "#FACC15",
    icon: "clock-outline",
  },
  aceita: {
    label: "Aceita",
    bg: "rgba(101,201,15,0.15)",
    color: "#7DE11B",
    icon: "check-decagram",
  },
  recusada: {
    label: "Recusada",
    bg: "rgba(248,113,113,0.12)",
    color: "#F87171",
    icon: "close-circle-outline",
  },
};

const SolicitacaoCard = ({ item }: { item: SolicitacaoMock }) => {
  const badge = statusBadge[item.status];

  return (
    <View className="mb-4 overflow-hidden rounded-[22px] border border-white/5 bg-[#101514]">
      <View className="flex-row items-center border-b border-white/5 px-4 py-3">
        <Image
          source={item.doacaoImagem}
          className="h-12 w-12 rounded-[14px]"
          resizeMode="cover"
        />
        <View className="ml-3 flex-1">
          <Text
            numberOfLines={1}
            className="text-[14px] font-semibold text-white"
          >
            {item.doacaoTitulo}
          </Text>
          <Text className="mt-[2px] text-[12px] text-[#A3A3A3]">
            {item.doacaoQuantidade} · Validade {item.doacaoValidade}
          </Text>
        </View>
        <View
          className="flex-row items-center rounded-full px-3 py-1"
          style={{ backgroundColor: badge.bg }}
        >
          <MaterialCommunityIcons
            name={badge.icon as any}
            size={13}
            color={badge.color}
          />
          <Text
            className="ml-1 text-[11px] font-semibold"
            style={{ color: badge.color }}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1C3010]">
            {item.solicitanteAvatar ? (
              <Image
                source={{ uri: item.solicitanteAvatar }}
                className="h-full w-full"
              />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={26}
                color="#7DE11B"
              />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-semibold text-white">
              {item.solicitanteNome}
            </Text>
            <Text className="mt-[2px] text-[12px] text-[#A3A3A3]">
              {item.solicitanteDoacoesRecebidas} doações recebidas
            </Text>
          </View>
          <Text className="text-[11px] text-[#7B7B7B]">{item.solicitadoEm}</Text>
        </View>

        <View className="mt-3 flex-row items-center">
          <Feather name="map-pin" size={12} color="#65C90F" />
          <Text className="ml-2 text-[12px] text-[#A3A3A3]">
            {item.distancia}
          </Text>
        </View>

        {item.status === "pendente" ? (
          <View className="mt-4 mb-4 flex-row" style={{ gap: 12 }}>
            <Pressable
              className="flex-1 flex-row items-center justify-center rounded-[14px] border border-white/10 bg-[#181D1B]"
              style={{ height: 44 }}
            >
              <Feather name="x" size={16} color="#F87171" />
              <Text className="ml-2 text-[14px] font-semibold text-[#F87171]">
                Recusar
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 overflow-hidden rounded-[14px]"
              style={{ height: 44 }}
            >
              <LinearGradient
                colors={["#7DE11B", "#58B50B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                }}
              >
                <Feather name="check" size={16} color="#081106" />
                <Text className="ml-2 text-[14px] font-semibold text-[#081106]">
                  Aceitar
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View className="mt-4 mb-4 flex-row items-center justify-between rounded-[14px] border border-white/5 bg-[#0D120F] px-4 py-3">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name={badge.icon as any}
                size={16}
                color={badge.color}
              />
              <Text
                className="ml-2 text-[13px] font-medium"
                style={{ color: badge.color }}
              >
                {item.status === "aceita"
                  ? "Solicitação aceita"
                  : "Solicitação recusada"}
              </Text>
            </View>
            <Pressable hitSlop={8}>
              <Text className="text-[12px] font-medium text-[#A3A3A3]">
                Ver detalhes
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const BecomeDonorEmptyState = () => (
  <View className="flex-1 items-center justify-center px-6 pb-24">
    <View
      className="mb-6 items-center justify-center rounded-full"
      style={{
        width: 96,
        height: 96,
        backgroundColor: "#18340D",
        borderWidth: 1.5,
        borderColor: "#2B5718",
      }}
    >
      <MaterialCommunityIcons name="hand-heart" size={44} color="#65C90F" />
    </View>
    <Text
      className="text-center text-[24px] font-semibold text-white"
      style={{ letterSpacing: -0.3 }}
    >
      Você ainda não é doador
    </Text>
    <Text className="mt-3 text-center text-[14px] leading-[20px] text-[#A3A3A3]">
      Para visualizar solicitações recebidas, é necessário concluir seu cadastro
      como doador no Alimenta+.
    </Text>

    <View className="mt-8 w-full rounded-[20px] border border-white/5 bg-[#101514] p-4">
      {[
        {
          icon: "gift-outline",
          title: "Cadastre doações",
          subtitle: "Publique alimentos disponíveis para retirada.",
        },
        {
          icon: "account-multiple-outline",
          title: "Receba solicitações",
          subtitle: "Acompanhe interessados em suas doações.",
        },
        {
          icon: "leaf",
          title: "Gere impacto",
          subtitle: "Ajude a reduzir desperdício e a fome.",
        },
      ].map((b, index, arr) => (
        <View key={b.title}>
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#1C3010]">
              <MaterialCommunityIcons
                name={b.icon as any}
                size={20}
                color="#65C90F"
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[14px] font-semibold text-white">
                {b.title}
              </Text>
              <Text className="mt-[2px] text-[12px] text-[#A3A3A3]">
                {b.subtitle}
              </Text>
            </View>
          </View>
          {index < arr.length - 1 ? (
            <View className="my-3 h-px bg-white/5" />
          ) : null}
        </View>
      ))}
    </View>

    <Pressable
      onPress={() => router.push("/(tabs)/become-donor" as any)}
      className="mt-7 w-full overflow-hidden rounded-[22px]"
    >
      <LinearGradient
        colors={["#7DE11B", "#58B50B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[56px] items-center justify-center rounded-[22px]"
      >
        <Text className="text-[16px] font-semibold text-[#081106]">
          Tornar-se doador
        </Text>
      </LinearGradient>
    </Pressable>

    <Pressable onPress={() => router.back()} className="mt-4">
      <Text className="text-[14px] text-[#A3A3A3]">Voltar</Text>
    </Pressable>
  </View>
);

export default function SolicitacoesRecebidasScreen() {
  const { user, initializing } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isDoador, setIsDoador] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<(typeof STATUS_FILTERS)[number]["value"]>("todas");

  useEffect(() => {
    const verificarDoador = async () => {
      if (initializing) {
        return;
      }

      if (!user || !db) {
        setIsDoador(false);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const tipo = (snapshot.data() as Partial<UserProfile> | undefined)
          ?.tipoUsuario;
        setIsDoador((tipo ?? "").trim().toLowerCase() === "doador");
      } catch {
        setIsDoador(false);
      } finally {
        setLoading(false);
      }
    };

    verificarDoador();
  }, [initializing, user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return SOLICITACOES_MOCK.filter((item) => {
      const matchesStatus =
        activeStatus === "todas" ? true : item.status === activeStatus;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        item.doacaoTitulo.toLowerCase().includes(term) ||
        item.solicitanteNome.toLowerCase().includes(term) ||
        item.doacaoCategoria.toLowerCase().includes(term)
      );
    });
  }, [search, activeStatus]);

  const totals = useMemo(() => {
    return {
      pendentes: SOLICITACOES_MOCK.filter((s) => s.status === "pendente")
        .length,
      aceitas: SOLICITACOES_MOCK.filter((s) => s.status === "aceita").length,
      recusadas: SOLICITACOES_MOCK.filter((s) => s.status === "recusada")
        .length,
    };
  }, []);

  if (initializing || loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#050807]">
        <StatusBar style="light" />
        <LinearGradient
          colors={["rgba(101,201,15,0.12)", "rgba(5,8,7,0)"]}
          style={absoluteFill}
        />
        <ActivityIndicator size="large" color="#65C90F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#050807]">
      <StatusBar style="light" />
      <LinearGradient
        colors={["rgba(12,20,12,0.96)", "rgba(5,8,7,1)", "rgba(5,8,7,1)"]}
        style={absoluteFill}
      />
      <View
        className="absolute -left-20 top-0 h-[260px] w-[260px] rounded-full"
        style={{ backgroundColor: "rgba(101,201,15,0.035)" }}
      />

      <View className="px-5 pt-3">
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[18px] font-semibold text-white">
            Solicitações recebidas
          </Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      {!isDoador ? (
        <BecomeDonorEmptyState />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 152 }}
        >
          <View className="px-5">
            <View className="mb-5 flex-row gap-3">
              <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#FACC15]">
                  Pendentes
                </Text>
                <Text className="mt-1 text-[22px] font-semibold text-white">
                  {totals.pendentes}
                </Text>
              </View>
              <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#7DE11B]">
                  Aceitas
                </Text>
                <Text className="mt-1 text-[22px] font-semibold text-white">
                  {totals.aceitas}
                </Text>
              </View>
              <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#F87171]">
                  Recusadas
                </Text>
                <Text className="mt-1 text-[22px] font-semibold text-white">
                  {totals.recusadas}
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row items-center rounded-2xl border border-white/5 bg-[#0D120F] px-4 h-12">
              <Feather name="search" size={16} color="#A1A1AA" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por doação ou solicitante..."
                placeholderTextColor="#71717A"
                className="flex-1 ml-3 text-[15px] text-white"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Feather name="x" size={16} color="#A1A1AA" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
            >
              {STATUS_FILTERS.map((f) => {
                const isActive = activeStatus === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => setActiveStatus(f.value)}
                    className={`mr-2 h-10 items-center justify-center rounded-xl px-5 ${
                      isActive ? "bg-[#1E3A0A]" : "bg-[#181D1B]"
                    }`}
                  >
                    <Text
                      className={`text-[13px] ${
                        isActive
                          ? "text-[#84CC16] font-semibold"
                          : "text-[#CFCFCF]"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filtered.length > 0 ? (
              <>
                <Text className="mb-3 text-[12px] text-[#7B7B7B]">
                  {filtered.length} solicitação(ões) encontrada(s)
                </Text>
                {filtered.map((item) => (
                  <SolicitacaoCard key={item.id} item={item} />
                ))}
              </>
            ) : (
              <View className="items-center justify-center pt-16">
                <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-[#18181B]">
                  <Feather name="inbox" size={28} color="#71717A" />
                </View>
                <Text className="text-[16px] font-semibold text-white">
                  Nenhuma solicitação encontrada
                </Text>
                <Text className="mt-2 px-10 text-center text-[13px] text-[#71717A]">
                  Tente ajustar os filtros ou aguarde novas solicitações.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

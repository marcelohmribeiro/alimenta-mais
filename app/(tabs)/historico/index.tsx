import useAuth from "@/hooks/_useAuth";
import { db } from "@/services";
import { useLoading } from "@/store";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AbaHistorico = "doador" | "receptor";

type DonationHistory = {
  id: string;
  tipoAlimento?: string;
  categoria?: string;
  quantidade?: string;
  descricao?: string;
  validade?: string;
  localizacao?: string;
  disponibilidade?: string;
  dataRetirada?: string;
  horarioInicio?: string;
  horarioFim?: string;
  tipoRetirada?: string;
  status?: string;
  donorId?: string;
  reivindicadoPor?: string;
  fotos?: any[];
  createdAt?: any;
};

const GREEN = "#65C90F";

const filtrosDoador = [
  { label: "Todos", value: "todos" },
  { label: "Em análise", value: "em_analise" },
  { label: "Aprovado", value: "aprovado" },
  { label: "Rejeitado", value: "rejeitado" },
  { label: "Cancelado", value: "cancelado" },
  { label: "Disponível", value: "disponivel" },
];

const filtrosReceptor = [
  { label: "Todos", value: "todos" },
  { label: "Em análise", value: "em_analise" },
  { label: "Aprovado", value: "aprovado" },
  { label: "Rejeitado", value: "rejeitado" },
  { label: "Cancelado", value: "cancelado" },
];

const normalizarStatus = (status?: string) => {
  const value = String(status || "").trim().toLowerCase();

  if (["em analise", "em_análise", "em análise", "pendente", "em_analise"].includes(value)) {
    return "em_analise";
  }

  if (["aprovado", "aprovada"].includes(value)) {
    return "aprovado";
  }

  if (["rejeitado", "rejeitada"].includes(value)) {
    return "rejeitado";
  }

  if (["cancelado", "cancelada"].includes(value)) {
    return "cancelado";
  }

  if (["disponivel", "disponível"].includes(value)) {
    return "disponivel";
  }

  return value || "em_analise";
};

const statusLabel = (status?: string) => {
  const value = normalizarStatus(status);

  const labels: Record<string, string> = {
    em_analise: "Em análise",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    cancelado: "Cancelado",
    disponivel: "Disponível",
  };

  return labels[value] ?? "Em análise";
};

const statusStyle = (status?: string) => {
  const value = normalizarStatus(status);

  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    em_analise: {
      bg: "rgba(250, 204, 21, 0.13)",
      text: "#FACC15",
      icon: "clock-outline",
    },
    aprovado: {
      bg: "rgba(101, 201, 15, 0.14)",
      text: "#7DE11B",
      icon: "check-circle-outline",
    },
    rejeitado: {
      bg: "rgba(248, 113, 113, 0.13)",
      text: "#F87171",
      icon: "close-circle-outline",
    },
    cancelado: {
      bg: "rgba(156, 163, 175, 0.14)",
      text: "#D1D5DB",
      icon: "minus-circle-outline",
    },
    disponivel: {
      bg: "rgba(59, 130, 246, 0.13)",
      text: "#60A5FA",
      icon: "gift-outline",
    },
  };

  return styles[value] ?? styles.em_analise;
};

const getImagem = (fotos?: any[]) => {
  if (!Array.isArray(fotos) || fotos.length === 0) return null;

  const primeira = fotos[0];

  if (typeof primeira === "string") return primeira;
  if (primeira?.secureUrl) return primeira.secureUrl;
  if (primeira?.url) return primeira.url;
  if (primeira?.uri) return primeira.uri;

  return null;
};

export default function HistoricoDoacoes() {
  const { user, initializing } = useAuth();

  const [aba, setAba] = useState<AbaHistorico>("doador");
  const [filtro, setFiltro] = useState("todos");
  const [doacoesDoador, setDoacoesDoador] = useState<DonationHistory[]>([]);
  const [doacoesReceptor, setDoacoesReceptor] = useState<DonationHistory[]>([]);
  const { startLoading, stopLoading } = useLoading();
  const [refreshing, setRefreshing] = useState(false);

  const filtros = aba === "doador" ? filtrosDoador : filtrosReceptor;

  const carregarHistorico = useCallback(async () => {
    if (!user?.uid || !db) {
      setDoacoesDoador([]);
      setDoacoesReceptor([]);
      stopLoading();
      return;
    }

    try {
      const donationsRef = collection(db, "donations");
      const solicitacoesRef = collection(db, "solicitacoes");

      const [doadorDonationsSnap, doadorSolicitacoesSnap, receptorSolicitacoesSnap] =
        await Promise.all([
          getDocs(query(donationsRef, where("donorId", "==", user.uid))),
          getDocs(query(solicitacoesRef, where("doadorId", "==", user.uid))),
          getDocs(query(solicitacoesRef, where("solicitanteId", "==", user.uid))),
        ]);

      // mapa doacaoId → status mais recente da solicitação
      const solicitacaoStatusMap = new Map<string, string>();
      doadorSolicitacoesSnap.docs.forEach((docItem) => {
        const data = docItem.data();
        const existing = solicitacaoStatusMap.get(data.doacaoId);
        // prefere status ativo (pendente/aprovada) sobre rejeitada
        if (!existing || data.status !== "rejeitada") {
          solicitacaoStatusMap.set(data.doacaoId, data.status);
        }
      });

      const sortByDate = (a: DonationHistory, b: DonationHistory) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

      // aba doador: todas as doações + status real da solicitação
      const doadorHistory: DonationHistory[] = doadorDonationsSnap.docs
        .map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<DonationHistory, "id">),
          status: solicitacaoStatusMap.get(docItem.id) ?? docItem.data().status,
        }))
        .sort(sortByDate);

      // aba receptor: solicitações feitas pelo usuário + dados completos da doação
      const receptorHistory: DonationHistory[] = (
        await Promise.all(
          receptorSolicitacoesSnap.docs.map(async (docItem) => {
            const sol = docItem.data();
            const doacaoSnap = sol.doacaoId
              ? await getDoc(doc(db!, "donations", sol.doacaoId))
              : null;
            const doacao = doacaoSnap?.exists() ? doacaoSnap.data() : null;

            return {
              id: docItem.id,
              tipoAlimento: doacao?.tipoAlimento ?? sol.doacaoTitulo,
              categoria: doacao?.categoria ?? sol.doacaoCategoria,
              quantidade: doacao?.quantidade ?? sol.doacaoQuantidade,
              validade: doacao?.validade ?? sol.doacaoValidade,
              localizacao: doacao?.localizacao,
              dataRetirada: doacao?.dataRetirada,
              horarioInicio: doacao?.horarioInicio,
              horarioFim: doacao?.horarioFim,
              tipoRetirada: doacao?.tipoRetirada,
              fotos: doacao?.fotos,
              status: sol.status,
              createdAt: sol.criadoEm,
            } as DonationHistory;
          }),
        )
      ).sort(sortByDate);

      setDoacoesDoador(doadorHistory);
      setDoacoesReceptor(receptorHistory);
    } catch (error) {
      console.log("ERRO AO CARREGAR HISTÓRICO:", error);
    } finally {
      stopLoading();
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (initializing) return;
    startLoading();
    carregarHistorico();
  }, [initializing, carregarHistorico]);

  const doacoesFiltradas = useMemo(() => {
    const lista = aba === "doador" ? doacoesDoador : doacoesReceptor;

    if (filtro === "todos") return lista;

    return lista.filter((item) => normalizarStatus(item.status) === filtro);
  }, [aba, filtro, doacoesDoador, doacoesReceptor]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarHistorico();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050807]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GREEN}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
       <View className="px-5 pt-4">
       <View className="mb-6">
        <Text className="text-white text-[28px] font-bold">
          Histórico
        </Text>

        <Text className="text-[#A3A3A3] mt-1">
          Acompanhe suas doações realizadas e recebidas.
        </Text>
      </View>

          <View className="flex-row bg-[#101514] border border-white/10 rounded-2xl p-1 mb-5">
            <Pressable
              onPress={() => {
                setAba("doador");
                setFiltro("todos");
              }}
              className={`flex-1 h-11 rounded-xl items-center justify-center ${
                aba === "doador" ? "bg-[#65C90F]" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  aba === "doador" ? "text-[#081106]" : "text-[#A3A3A3]"
                }`}
              >
                Doador
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setAba("receptor");
                setFiltro("todos");
              }}
              className={`flex-1 h-11 rounded-xl items-center justify-center ${
                aba === "receptor" ? "bg-[#65C90F]" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  aba === "receptor" ? "text-[#081106]" : "text-[#A3A3A3]"
                }`}
              >
                Receptor
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
          >
            <View className="flex-row gap-2">
              {filtros.map((item) => {
                const active = filtro === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setFiltro(item.value)}
                    className={`px-4 h-10 rounded-full items-center justify-center border ${
                      active
                        ? "bg-[#65C90F] border-[#65C90F]"
                        : "bg-[#101514] border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        active ? "text-[#081106]" : "text-[#D1D5DB]"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="mb-4 rounded-[22px] border border-[#2B4F17] bg-[#101A0F] px-4 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-[16px] font-semibold">
                  {aba === "doador"
                    ? "Doações abertas por você"
                    : "Doações recebidas"}
                </Text>
                <Text className="text-[#A3A3A3] text-[13px] mt-1">
                  {doacoesFiltradas.length} registro(s) encontrado(s)
                </Text>
              </View>

              <View className="w-11 h-11 rounded-full bg-[#18340D] items-center justify-center">
                <MaterialCommunityIcons
                  name={aba === "doador" ? "gift-outline" : "archive-outline"}
                  size={23}
                  color={GREEN}
                />
              </View>
            </View>
          </View>

          {doacoesFiltradas.length === 0 ? (
            <View className="items-center justify-center rounded-[28px] border border-white/10 bg-[#101514] px-6 py-12">
              <View className="w-16 h-16 rounded-full bg-[#18340D] items-center justify-center mb-4">
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={32}
                  color={GREEN}
                />
              </View>
              <Text className="text-white text-[20px] font-bold text-center">
                Nenhum histórico encontrado
              </Text>
              <Text className="text-[#A3A3A3] text-center mt-2">
                Quando houver registros com esse filtro, eles aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {doacoesFiltradas.map((item) => (
                <HistoricoCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
 );
}

function HistoricoCard({ item }: { item: DonationHistory }) {
  const imagem = getImagem(item.fotos);
  const status = statusStyle(item.status);

  return (
    <View className="rounded-[26px] border border-white/10 bg-[#101514] overflow-hidden">
      <View className="flex-row p-4">
        <View className="w-[96px] h-[96px] rounded-[22px] overflow-hidden bg-[#182018] border border-white/10">
          {imagem ? (
            <Image
              source={{ uri: imagem }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons
                name="food-apple-outline"
                size={34}
                color={GREEN}
              />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-white text-[18px] font-bold" numberOfLines={1}>
                {item.tipoAlimento || "Doação de alimento"}
              </Text>

              <Text className="text-[#A3A3A3] text-[13px] mt-1" numberOfLines={1}>
                {item.categoria || "Categoria não informada"}
              </Text>
            </View>

            <View
              className="px-3 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: status.bg }}
            >
              <MaterialCommunityIcons
                name={status.icon as any}
                size={14}
                color={status.text}
              />
              <Text
                className="text-[12px] font-semibold ml-1"
                style={{ color: status.text }}
              >
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View className="mt-3 gap-2">
            <InfoLine
              icon="weight-kilogram"
              text={item.quantidade || "Quantidade não informada"}
            />

            <InfoLine
              icon="calendar-outline"
              text={item.disponibilidade || item.dataRetirada || "Data não informada"}
            />

            <InfoLine
              icon="map-marker-outline"
              text={item.localizacao || "Local não informado"}
            />
          </View>
        </View>
      </View>

      <View className="border-t border-white/5 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-[#A3A3A3] text-[13px]">
          Retirada:{" "}
          <Text className="text-white font-semibold">
            {item.tipoRetirada === "doador"
              ? "pelo doador"
              : item.tipoRetirada === "buscador"
                ? "pelo buscador"
                : "não informado"}
          </Text>
        </Text>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#A3A3A3"
        />
      </View>
    </View>
  );
}

function InfoLine({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-center">
      <MaterialCommunityIcons name={icon} size={16} color={GREEN} />
      <Text className="text-[#D1D5DB] text-[13px] ml-2 flex-1" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}
import { absoluteFill } from "@/constants";
import useAuth from "@/hooks/_useAuth";
import {
  aceitarSolicitacao,
  buscarSolicitacoesRecebidasDoDoador,
  db,
  recusarSolicitacao,
} from "@/services";
import { MotivoRecusa, SolicitacaoComId, SolicitacaoStatus, UserProfile } from "@/types";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatusFilter = "todas" | SolicitacaoStatus;

const fallbackImage = require("@/assets/images/pao.jpg");

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: "todas" },
  { label: "Pendentes", value: "pendente" },
  { label: "Aceitas", value: "aceita" },
  { label: "Recusadas", value: "recusada" },
];

const MOTIVOS_RECUSA: MotivoRecusa[] = [
  "Alimento venceu",
  "Alimento estragou",
  "Não consigo fazer essa entrega",
  "Não consigo entregar no dia combinado",
  "Doação já realizada",
];

const statusBadge: Record <
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
              <Text className="text-[14px] font-semibold text-white">{b.title}</Text>
              <Text className="mt-[2px] text-[12px] text-[#A3A3A3]">{b.subtitle}</Text>
            </View>
          </View>
          {index < arr.length - 1 ? <View className="my-3 h-px bg-white/5" /> : null}
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

type SolicitacaoCardProps = {
  item: SolicitacaoComId;
  onAceitar: (item: SolicitacaoComId) => void;
  onRecusar: (item: SolicitacaoComId) => void;
};

const SolicitacaoCard = ({ item, onAceitar, onRecusar }: SolicitacaoCardProps) => {
  const badge = statusBadge[item.status];

  return (
    <View className="mb-4 overflow-hidden rounded-[22px] border border-white/5 bg-[#101514]">
      <View className="flex-row items-center border-b border-white/5 px-4 py-3">
        <Image
          source={fallbackImage}
          className="h-12 w-12 rounded-[14px]"
          resizeMode="cover"
        />
        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-[14px] font-semibold text-white">
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
          <MaterialCommunityIcons name={badge.icon as any} size={13} color={badge.color} />
          <Text className="ml-1 text-[11px] font-semibold" style={{ color: badge.color }}>
            {badge.label}
          </Text>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1C3010]">
            {item.solicitanteAvatar ? (
              <Image source={{ uri: item.solicitanteAvatar }} className="h-full w-full" />
            ) : (
              <MaterialCommunityIcons name="account" size={26} color="#7DE11B" />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-semibold text-white">
              {item.solicitanteNome}
            </Text>
            <Text className="mt-[2px] text-[12px] text-[#A3A3A3]">
              Solicitante
            </Text>
          </View>
        </View>

        {item.status === "pendente" ? (
          <View className="mt-4 mb-4 flex-row" style={{ gap: 12 }}>
            <Pressable
              onPress={() => onRecusar(item)}
              className="flex-1 flex-row items-center justify-center rounded-[14px] border border-white/10 bg-[#181D1B]"
              style={{ height: 44 }}
            >
              <Feather name="x" size={16} color="#F87171" />
              <Text className="ml-2 text-[14px] font-semibold text-[#F87171]">
                Recusar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onAceitar(item)}
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
              <MaterialCommunityIcons name={badge.icon as any} size={16} color={badge.color} />
              <Text className="ml-2 text-[13px] font-medium" style={{ color: badge.color }}>
                {item.status === "aceita" ? "Solicitação aceita" : "Solicitação recusada"}
              </Text>
            </View>
            {item.motivoRecusa ? (
              <Text className="text-[12px] text-[#A3A3A3]">{item.motivoRecusa}</Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
};

export default function SolicitacoesRecebidasScreen() {
  const { user, initializing } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isDoador, setIsDoador] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComId[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("todas");
  const [processando, setProcessando] = useState(false);

  const [modalRecusaVisible, setModalRecusaVisible] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoComId | null>(null);
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoRecusa | null>(null);

  const carregarDados = useCallback(async () => {
    if (!user || !db) {
      setIsDoador(false);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      const tipo = (snapshot.data() as Partial<UserProfile> | undefined)?.tipoUsuario;
      const doador = (tipo ?? "").trim().toLowerCase() === "doador";
      setIsDoador(doador);

      if (doador) {
        const dados = await buscarSolicitacoesRecebidasDoDoador(user.uid);
        setSolicitacoes(dados);
      }
    } catch {
      setIsDoador(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initializing) return;
    carregarDados();
  }, [initializing, carregarDados]);

  const handleAceitar = (item: SolicitacaoComId) => {
    Alert.alert(
      "Aceitar solicitação",
      `Confirma que vai aceitar a solicitação de ${item.solicitanteNome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceitar",
          onPress: async () => {
            try {
              setProcessando(true);
              await aceitarSolicitacao(item.id, item.doacaoId);
              await carregarDados();
              Alert.alert("Sucesso", "Solicitação aceita com sucesso!");
            } catch {
              Alert.alert("Erro", "Não foi possível aceitar a solicitação.");
            } finally {
              setProcessando(false);
            }
          },
        },
      ]
    );
  };

  const handleRecusar = (item: SolicitacaoComId) => {
    setSolicitacaoSelecionada(item);
    setMotivoSelecionado(null);
    setModalRecusaVisible(true);
  };

  const confirmarRecusa = async () => {
    if (!solicitacaoSelecionada || !motivoSelecionado) {
      Alert.alert("Atenção", "Selecione um motivo para recusar.");
      return;
    }

    try {
      setProcessando(true);
      setModalRecusaVisible(false);
      await recusarSolicitacao(
        solicitacaoSelecionada.id,
        solicitacaoSelecionada.doacaoId,
        motivoSelecionado
      );
      await carregarDados();
      Alert.alert("Solicitação recusada", "A solicitação foi recusada.");
    } catch {
      Alert.alert("Erro", "Não foi possível recusar a solicitação.");
    } finally {
      setProcessando(false);
      setSolicitacaoSelecionada(null);
      setMotivoSelecionado(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return solicitacoes.filter((item) => {
      const matchesStatus = activeStatus === "todas" ? true : item.status === activeStatus;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        item.doacaoTitulo.toLowerCase().includes(term) ||
        item.solicitanteNome.toLowerCase().includes(term) ||
        item.doacaoCategoria.toLowerCase().includes(term)
      );
    });
  }, [search, activeStatus, solicitacoes]);

  const totals = useMemo(() => ({
    pendentes: solicitacoes.filter((s) => s.status === "pendente").length,
    aceitas: solicitacoes.filter((s) => s.status === "aceita").length,
    recusadas: solicitacoes.filter((s) => s.status === "recusada").length,
  }), [solicitacoes]);

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
          <View className="h-10 w-10" />
          <Text className="text-[18px] font-semibold text-white">
            Solicitações recebidas
          </Text>
          <Pressable onPress={carregarDados} hitSlop={12} className="h-10 w-10 items-center justify-center">
            <Feather name="refresh-cw" size={18} color="#A3A3A3" />
          </Pressable>
        </View>
      </View>

      {!isDoador ? (
        <BecomeDonorEmptyState />
      ) : (
        <>
          {processando ? (
            <View className="absolute inset-0 items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
              <ActivityIndicator size="large" color="#65C90F" />
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 152 }}
          >
            <View className="px-5">
              <View className="mb-5 flex-row gap-3">
                <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                  <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#FACC15]">Pendentes</Text>
                  <Text className="mt-1 text-[22px] font-semibold text-white">{totals.pendentes}</Text>
                </View>
                <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                  <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#7DE11B]">Aceitas</Text>
                  <Text className="mt-1 text-[22px] font-semibold text-white">{totals.aceitas}</Text>
                </View>
                <View className="flex-1 rounded-[18px] border border-white/5 bg-[#101514] px-4 py-3">
                  <Text className="text-[11px] font-medium uppercase tracking-[0.4px] text-[#F87171]">Recusadas</Text>
                  <Text className="mt-1 text-[22px] font-semibold text-white">{totals.recusadas}</Text>
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

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                {STATUS_FILTERS.map((f) => {
                  const isActive = activeStatus === f.value;
                  return (
                    <Pressable
                      key={f.value}
                      onPress={() => setActiveStatus(f.value)}
                      className={`mr-2 h-10 items-center justify-center rounded-xl px-5 ${isActive ? "bg-[#1E3A0A]" : "bg-[#181D1B]"}`}
                    >
                      <Text className={`text-[13px] ${isActive ? "text-[#84CC16] font-semibold" : "text-[#CFCFCF]"}`}>
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
                    <SolicitacaoCard
                      key={item.id}
                      item={item}
                      onAceitar={handleAceitar}
                      onRecusar={handleRecusar}
                    />
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
        </>
      )}

      <Modal
        visible={modalRecusaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRecusaVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60 px-4 pb-6">
          <Pressable
            className="absolute inset-0"
            onPress={() => setModalRecusaVisible(false)}
          />
          <View className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111615] px-5 pb-5 pt-5">
            <Text className="text-[18px] font-semibold text-white">
              Motivo da recusa
            </Text>
            <Text className="mt-1 mb-4 text-[13px] text-[#A3A3A3]">
              Selecione o motivo para recusar esta solicitação.
            </Text>

            {MOTIVOS_RECUSA.map((motivo) => {
              const selecionado = motivoSelecionado === motivo;
              return (
                <TouchableOpacity
                  key={motivo}
                  onPress={() => setMotivoSelecionado(motivo)}
                  className="mb-3 flex-row items-center rounded-[16px] border px-4 py-3"
                  style={{
                    borderColor: selecionado ? "#65C90F" : "rgba(255,255,255,0.08)",
                    backgroundColor: selecionado ? "rgba(101,201,15,0.08)" : "#0D120F",
                  }}
                >
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full border mr-3"
                    style={{ borderColor: selecionado ? "#65C90F" : "#4B5563" }}
                  >
                    {selecionado ? (
                      <View className="h-3 w-3 rounded-full bg-[#65C90F]" />
                    ) : null}
                  </View>
                  <Text className="flex-1 text-[14px] text-white">{motivo}</Text>
                </TouchableOpacity>
              );
            })}

            <Pressable
              onPress={confirmarRecusa}
              disabled={!motivoSelecionado}
              className="mt-2 overflow-hidden rounded-[18px]"
              style={{ opacity: motivoSelecionado ? 1 : 0.4 }}
            >
              <LinearGradient
                colors={["#F87171", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 48, alignItems: "center", justifyContent: "center", borderRadius: 18 }}
              >
                <Text className="text-[15px] font-semibold text-white">Confirmar recusa</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setModalRecusaVisible(false)}
              className="mt-3 h-12 items-center justify-center"
            >
              <Text className="text-[15px] text-[#A3A3A3]">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
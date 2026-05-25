import { Box, HStack, Text, VStack } from "@/components/ui";
import useAuth from "@/hooks/_useAuth";
import {
  buscarDoacao,
  buscarPerfilUsuario,
  FirestoreServiceError,
  reivindicarDoacao,
} from "@/services";
import { UserProfile } from "@/types";
import { formatarData, formatarHorario } from "@/utils";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fallbackImage = require("@/assets/images/pao.jpg");

const InfoCell = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <VStack className="flex-1">
    <HStack className="flex-row items-center mb-1">
      <FontAwesome5 name={icon} size={13} color="#65A30D" />
      <Text className="text-[#71717A] text-xs ml-2">{label}</Text>
    </HStack>
    <Text className="text-white text-base font-semibold" numberOfLines={2}>
      {value}
    </Text>
  </VStack>
);

export default function DonationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [donation, setDonation] = useState<Awaited<ReturnType<typeof buscarDoacao>>>(null);
  const [loading, setLoading] = useState(true);
  const [donorProfile, setDonorProfile] = useState<UserProfile | null>(null);
  const [loadingDonor, setLoadingDonor] = useState(false);
  const [dataAgendada, setDataAgendada] = useState("");
  const [horarioAgendado, setHorarioAgendado] = useState("");
  const [reivindicando, setReivindicando] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    if (!id) return;
    buscarDoacao(id).then((data) => {
      setDonation(data);
      setLoading(false);
      if (data?.donorId) {
        setLoadingDonor(true);
        buscarPerfilUsuario(data.donorId)
          .then(setDonorProfile)
          .finally(() => setLoadingDonor(false));
      }
    });
  }, [id]);

  const handleReivindicar = async () => {
    if (!user) {
      Alert.alert("Atenção", "Você precisa estar logado para reivindicar uma doação.");
      return;
    }
    if (!donation) return;

    setReivindicando(true);
    try {
      await reivindicarDoacao(donation.id, user.uid, dataAgendada, horarioAgendado);
      setDonation((prev) =>
        prev ? { ...prev, status: "em análise", reivindicadoPor: user.uid, dataAgendada, horarioAgendado } : prev
      );
      Alert.alert("Sucesso!", "Doação reivindicada com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof FirestoreServiceError
          ? error.message
          : "Não foi possível reivindicar a doação. Tente novamente.";
      Alert.alert("Erro", message);
    } finally {
      setReivindicando(false);
    }
  };

  const firstPhoto = donation?.fotos?.[0]?.secureUrl ?? null;
  const canClaim = donation?.status === "disponivel";
  const isClaimed = donation?.status === "em análise";
  const tipoRetiradaLabel =
    donation?.tipoRetirada === "doador" ? "Entrega pelo doador" : "Retirada pelo receptor";
  const tipoRetiradaIcon = donation?.tipoRetirada === "doador" ? "truck" : "walking";
  const isScheduleValid = dataAgendada.length === 10 && horarioAgendado.length === 5;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Header */}
      <HStack className="flex-row items-center px-5 pt-2 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-3">
          <FontAwesome5 name="arrow-left" size={18} color="#A1A1AA" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
          {loading ? "Carregando..." : (donation?.tipoAlimento ?? "Doação")}
        </Text>
      </HStack>

      {loading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator color="#65A30D" size="large" />
        </Box>
      ) : !donation ? (
        <Box className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold mb-2">Doação não encontrada</Text>
          <Text className="text-[#71717A] text-center">Esta doação pode ter sido removida.</Text>
        </Box>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            {/* Foto */}
            <Image
              source={firstPhoto ? { uri: firstPhoto } : fallbackImage}
              style={{ width: "100%", height: 220, borderRadius: 20, marginBottom: 16 }}
              resizeMode="cover"
            />

            {/* Badges */}
            <HStack className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              <Box className="bg-[#1E3A0A] rounded-full px-3 py-1">
                <Text className="text-[#84CC16] text-xs font-semibold">{donation.categoria}</Text>
              </Box>
              {donation.perecivel && (
                <Box
                  className="border rounded-full px-3 py-1"
                  style={{ backgroundColor: "rgba(127,29,29,0.2)", borderColor: "rgba(127,29,29,0.4)" }}
                >
                  <Text className="text-red-400 text-xs font-semibold">Perecível</Text>
                </Box>
              )}
              <Box className="bg-[#27272A] rounded-full px-3 py-1 flex-row items-center" style={{ gap: 5 }}>
                <FontAwesome5 name={tipoRetiradaIcon} size={10} color="#A1A1AA" />
                <Text className="text-[#A1A1AA] text-xs">{tipoRetiradaLabel}</Text>
              </Box>
            </HStack>

            {/* Quantidade | Validade */}
            <Box className="bg-[#141416] rounded-2xl p-4 mb-3">
              <HStack style={{ gap: 16 }}>
                <InfoCell icon="weight" label="Quantidade" value={donation.quantidade} />
                <Box className="w-px bg-[#27272A]" />
                <InfoCell icon="calendar-alt" label="Validade" value={donation.validade} />
              </HStack>
            </Box>

            {/* Localização */}
            <Box className="bg-[#141416] rounded-2xl px-4 py-3 mb-3">
              <HStack className="flex-row items-center" style={{ gap: 10 }}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#65A30D" />
                <Text className="text-white text-sm flex-1" numberOfLines={2}>
                  {donation.localizacao || "Localização não informada"}
                </Text>
              </HStack>
            </Box>

            {/* Data + Horário */}
            <Box className="bg-[#141416] rounded-2xl px-4 py-3 mb-4">
              <HStack className="flex-row items-center" style={{ gap: 10 }}>
                <FontAwesome5 name="calendar-check" size={14} color="#65A30D" />
                <Text className="text-white text-sm">{donation.dataRetirada}</Text>
                <Text className="text-[#52525B]">·</Text>
                <FontAwesome5 name="clock" size={12} color="#65A30D" />
                <Text className="text-white text-sm">
                  {donation.horarioInicio} – {donation.horarioFim}
                </Text>
              </HStack>
            </Box>

            {/* Descrição */}
            {!!donation.descricao && (
              <Box className="mb-4">
                <Text className="text-[#71717A] text-xs mb-1.5 uppercase tracking-widest">Descrição</Text>
                <Text className="text-white text-sm leading-6">{donation.descricao}</Text>
              </Box>
            )}

            {/* Observações */}
            {!!donation.observacoes && (
              <Box className="mb-4">
                <Text className="text-[#71717A] text-xs mb-1.5 uppercase tracking-widest">Observações</Text>
                <Text className="text-white text-sm leading-6">{donation.observacoes}</Text>
              </Box>
            )}

            {/* Divider + Doador */}
            <Box className="h-px bg-[#27272A] my-4" />

            {loadingDonor ? (
              <ActivityIndicator size="small" color="#65A30D" />
            ) : (
              <HStack className="flex-row items-center" style={{ gap: 12 }}>
                <Box className="w-11 h-11 rounded-full bg-[#1E3A0A] items-center justify-center overflow-hidden">
                  {donorProfile?.fotoPerfil ? (
                    <Image
                      source={{ uri: donorProfile.fotoPerfil }}
                      style={{ width: 44, height: 44 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <FontAwesome5 name="user" size={18} color="#84CC16" />
                  )}
                </Box>
                <VStack>
                  <Text className="text-[#71717A] text-xs uppercase tracking-widest">Doador</Text>
                  <Text className="text-white text-base font-semibold">
                    {donorProfile?.nome || "Doador"}
                  </Text>
                </VStack>
              </HStack>
            )}

            {/* Agendamento */}
            {canClaim && (
              <>
                <Box className="h-px bg-[#27272A] my-4" />
                <Text className="text-[#71717A] text-xs mb-3 uppercase tracking-widest">
                  Agendar retirada
                </Text>

                <HStack style={{ gap: 12 }}>
                  <Box className="flex-1">
                    <Text className="text-[#A1A1AA] text-xs mb-2">Data</Text>
                    <HStack className="items-center bg-[#27272A] rounded-xl px-3 h-12 border border-[#3F3F46]">
                      <FontAwesome5 name="calendar-alt" size={12} color="#65A30D" />
                      <TextInput
                        value={dataAgendada}
                        onChangeText={(t) => setDataAgendada(formatarData(t))}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#52525B"
                        keyboardType="numeric"
                        maxLength={10}
                        style={{ flex: 1, color: "white", marginLeft: 8, fontSize: 14 }}
                      />
                    </HStack>
                  </Box>

                  <Box className="flex-1">
                    <Text className="text-[#A1A1AA] text-xs mb-2">Horário</Text>
                    <HStack className="items-center bg-[#27272A] rounded-xl px-3 h-12 border border-[#3F3F46]">
                      <FontAwesome5 name="clock" size={12} color="#65A30D" />
                      <TextInput
                        value={horarioAgendado}
                        onChangeText={(t) => setHorarioAgendado(formatarHorario(t))}
                        placeholder="HH:MM"
                        placeholderTextColor="#52525B"
                        keyboardType="numeric"
                        maxLength={5}
                        style={{ flex: 1, color: "white", marginLeft: 8, fontSize: 14 }}
                      />
                    </HStack>
                  </Box>
                </HStack>

                <Text className="text-[#52525B] text-xs mt-2">
                  Disponível de {donation.horarioInicio} às {donation.horarioFim}
                </Text>
              </>
            )}
          </ScrollView>

          {/* Botão fixo na base */}
          <Box className="px-5 pt-3" style={{ paddingBottom: tabBarHeight + 12 }}>
            {canClaim ? (
              <TouchableOpacity
                onPress={handleReivindicar}
                disabled={reivindicando || !isScheduleValid}
                activeOpacity={isScheduleValid ? 0.8 : 1}
              >
                <Box
                  className={`rounded-2xl h-14 items-center justify-center ${
                    isScheduleValid ? "bg-[#65A30D]" : "bg-[#27272A]"
                  }`}
                >
                  {reivindicando ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      className={`font-semibold text-base ${
                        isScheduleValid ? "text-white" : "text-[#71717A]"
                      }`}
                    >
                      {isScheduleValid ? "Reivindicar doação" : "Preencha data e horário"}
                    </Text>
                  )}
                </Box>
              </TouchableOpacity>
            ) : isClaimed ? (
              <Box className="bg-[#27272A] rounded-2xl h-14 items-center justify-center">
                <Text className="text-[#71717A] text-base">Já reivindicada</Text>
              </Box>
            ) : (
              <Box className="bg-[#27272A] rounded-2xl h-14 items-center justify-center">
                <Text className="text-[#71717A] text-base">Doação indisponível</Text>
              </Box>
            )}
          </Box>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

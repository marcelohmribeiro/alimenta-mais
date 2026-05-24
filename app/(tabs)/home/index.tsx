import useAuth from "@/hooks/_useAuth";
import { FirestoreServiceError, listarDoacoes, reivindicarDoacao } from "@/services";
import { DonationDocumentWithId, DonationStatus } from "@/types";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const LOCATION_PERMISSION_KEY = "@location_permission_granted";

const fallbackImage = require("@/assets/images/pao.jpg");
const baseCategories = ["Todas", "Prontos", "Frutas", "Verduras", "Pães"];

type DonationCardItem = {
  id: string;
  title: string;
  weight: string;
  distance: string;
  date: string;
  category: string;
  imageUri?: string | null;
  status: DonationStatus;
};

type DonationCardProps = Omit<DonationCardItem, "id" | "category"> & {
  onReivindicar?: () => void;
  reivindicando?: boolean;
};

const DonationCard = ({
  title,
  weight,
  distance,
  date,
  imageUri,
  status,
  onReivindicar,
  reivindicando,
}: DonationCardProps) => (
  <Box className="bg-[#141416] rounded-[24px] p-3 mb-3 border border-[#1E1E21]">
    <HStack className="flex-row items-center">
      <Image
        source={imageUri ? { uri: imageUri } : fallbackImage}
        className="w-[100px] h-[100px] rounded-[20px]"
        resizeMode="cover"
      />

      <VStack className="ml-4 flex-1 items-start">
        <Text className="text-white font-semibold text-lg leading-tight mb-0.5">
          {title}
        </Text>

        <Text className="text-[#A1A1AA] text-sm mb-2">{weight}</Text>

        <HStack className="flex-row items-center mb-1">
          <FontAwesome5 name="map-marker-alt" size={12} color="#65A30D" />

          <Text className="text-[#A1A1AA] text-[13px] ml-2">{distance}</Text>
        </HStack>

        <HStack className="flex-row items-center">
          <FontAwesome5 name="clock" size={12} color="#65A30D" />

          <Text className="text-[#A1A1AA] text-[13px] ml-2">
            Validade: {date}
          </Text>
        </HStack>
      </VStack>
    </HStack>

    {status === "disponivel" ? (
      <TouchableOpacity
        onPress={onReivindicar}
        disabled={reivindicando}
        activeOpacity={0.8}
        className="mt-3"
      >
        <Box className="bg-[#65A30D] rounded-2xl h-10 items-center justify-center">
          {reivindicando ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-sm">
              Reivindicar doação
            </Text>
          )}
        </Box>
      </TouchableOpacity>
    ) : status === "reivindicada" ? (
      <Box className="mt-3 bg-[#27272A] rounded-2xl h-10 items-center justify-center">
        <Text className="text-[#71717A] text-sm">Já reivindicada</Text>
      </Box>
    ) : null}
  </Box>
);

export default function Home() {
  const { user } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [donations, setDonations] = useState<DonationDocumentWithId[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [reivindicandoId, setReivindicandoId] = useState<string | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    let active = true;

    const loadDonations = async () => {
      try {
        setLoadingDonations(true);
        setDonationsError(null);
        const data = await listarDoacoes();

        if (active) {
          setDonations(data);
        }
      } catch (error) {
        console.error("Erro ao carregar doações:", error);
        if (active) {
          setDonationsError("Não foi possível carregar as doações.");
          setDonations([]);
        }
      } finally {
        if (active) {
          setLoadingDonations(false);
        }
      }
    };

    loadDonations();

    return () => {
      active = false;
    };
  }, []);

  const checkLocationPermission = async () => {
    try {
      const alreadyAccepted = await AsyncStorage.getItem(
        LOCATION_PERMISSION_KEY,
      );

      const { status } = await Location.getForegroundPermissionsAsync();

      if (alreadyAccepted === "true" || status === "granted") {
        return;
      }

      setShowLocationModal(true);
    } catch (error) {
      console.log("Erro ao verificar localização:", error);
    }
  };

  const handleEnableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, "true");

        setShowLocationModal(false);
      }
    } catch (error) {
      console.log("Erro ao solicitar localização:", error);
    }
  };

  const handleReivindicar = async (donationId: string) => {
    if (!user) {
      Alert.alert(
        "Atenção",
        "Você precisa estar logado para reivindicar uma doação."
      );
      return;
    }

    setReivindicandoId(donationId);
    try {
      await reivindicarDoacao(donationId, user.uid);
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? { ...d, status: "reivindicada", reivindicadoPor: user.uid }
            : d
        )
      );
      Alert.alert("Sucesso!", "Doação reivindicada com sucesso.");
    } catch (error) {
      const message =
        error instanceof FirestoreServiceError
          ? error.message
          : "Não foi possível reivindicar a doação. Tente novamente.";
      Alert.alert("Erro", message);
    } finally {
      setReivindicandoId(null);
    }
  };

  const categories = useMemo(() => {
    const fromData = donations
      .map((donation) => donation.categoria)
      .filter(Boolean);
    const unique = Array.from(new Set([...baseCategories, ...fromData]));
    return unique;
  }, [donations]);

  const donationCards = useMemo<DonationCardItem[]>(
    () =>
      donations.map((donation) => ({
        id: donation.id,
        title: donation.tipoAlimento,
        weight: donation.quantidade,
        distance: donation.localizacao
          ? `Local: ${donation.localizacao}`
          : "Localização não informada",
        date: donation.validade,
        category: donation.categoria,
        imageUri: donation.fotos?.[0]?.secureUrl ?? null,
        status: donation.status,
      })),
    [donations]
  );

  const filteredDonations = useMemo(() => {
    return donationCards.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas"
          ? true
          : item.category === selectedCategory;

      const searchTerm = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm) ||
        item.weight.toLowerCase().includes(searchTerm) ||
        item.distance.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }, [donationCards, search, selectedCategory]);

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F0C]">
      <Box className="flex-1 bg-[#09090B] pt-12 px-4">
        {/* Header */}
        <HStack className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-2xl font-bold">
            Doações
          </Text>

          <Box className="bg-[#1E3A0A] w-10 h-10 rounded-full items-center justify-center">
            <FontAwesome5 name="seedling" size={16} color="#84CC16" />
          </Box>
        </HStack>

        {/* Search */}
        <HStack className="flex-row items-center mb-6">
          <Box className="flex-1 flex-row items-center bg-black/30 rounded-2xl px-4 h-12 border border-[#27272A]">
            <FontAwesome5 name="search" size={16} color="#A1A1AA" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar doações..."
              placeholderTextColor="#71717A"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-white ml-3 text-[16px]"
              style={{ fontFamily: "System" }}
            />
          </Box>

          {/* Botão limpar filtro */}
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Box className="ml-3 bg-[#1C1C1E] rounded-2xl w-12 h-12 items-center justify-center">
                <FontAwesome5 name="times" size={18} color="white" />
              </Box>
            </TouchableOpacity>
          )}
        </HStack>

        {/* Categories */}
        <Box className="h-12 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => {
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Button
                    className={`${
                      selectedCategory === cat ? "bg-[#1E3A0A]" : "bg-[#27272A]"
                    } mr-2 px-6 rounded-xl h-10 border-0 items-center justify-center`}
                  >
                    <ButtonText
                      className={`${
                        selectedCategory === cat
                          ? "text-[#84CC16] font-bold"
                          : "text-gray-300"
                      } text-center text-sm`}
                    >
                      {cat}
                    </ButtonText>
                  </Button>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Box>

        {/* Resultados */}
        <Text className="text-[#71717A] mb-4 text-sm">
          {filteredDonations.length} doação(ões) encontrada(s)
        </Text>

        {/* Donation List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >
          {loadingDonations ? (
            <Box className="items-center justify-center mt-20">
              <ActivityIndicator color="#65A30D" size="large" />
              <Text className="text-[#A1A1AA] text-center mt-4">
                Carregando doações...
              </Text>
            </Box>
          ) : filteredDonations.length > 0 ? (
            filteredDonations.map((item) => (
              <DonationCard
                key={item.id}
                title={item.title}
                weight={item.weight}
                distance={item.distance}
                date={item.date}
                imageUri={item.imageUri}
                status={item.status}
                onReivindicar={() => handleReivindicar(item.id)}
                reivindicando={reivindicandoId === item.id}
              />
            ))
          ) : (
            <Box className="items-center justify-center mt-20">
              <Box className="bg-[#18181B] w-20 h-20 rounded-full items-center justify-center mb-4">
                <FontAwesome5 name="search" size={28} color="#71717A" />
              </Box>

              <Text className="text-white text-lg font-semibold mb-2">
                {donationsError ?? "Nenhuma doação encontrada"}
              </Text>

              <Text className="text-[#71717A] text-center px-8">
                {donationsError
                  ? "Tente novamente mais tarde."
                  : "Tente pesquisar outro alimento ou mudar a categoria."}
              </Text>
            </Box>
          )}
        </ScrollView>
      </Box>

      {/* Modal localização */}
      <Modal isOpen={showLocationModal}>
        <ModalBackdrop />

        <ModalContent className="bg-[#18181B] border border-[#27272A] rounded-[28px] mx-6">
          <ModalHeader className="items-center pt-6">
            <Box className="bg-[#1E3A0A] w-16 h-16 rounded-full items-center justify-center mb-4">
              <FontAwesome5 name="map-marker-alt" size={24} color="#84CC16" />
            </Box>
          </ModalHeader>

          <ModalBody className="pb-2">
            <Text className="text-white text-xl font-bold text-center mb-3">
              Habilitar localização
            </Text>

            <Text className="text-[#A1A1AA] text-center leading-6">
              Precisamos da sua localização para mostrar doações próximas de
              você em tempo real.
            </Text>
          </ModalBody>

          <ModalFooter className="flex-col pb-6 pt-4">
            <Button
              onPress={handleEnableLocation}
              className="bg-[#65A30D] w-full rounded-2xl h-12 mb-3"
            >
              <ButtonText className="text-white font-semibold">
                Permitir acesso
              </ButtonText>
            </Button>

            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Text className="text-[#A1A1AA] text-center">Agora não</Text>
            </TouchableOpacity>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}

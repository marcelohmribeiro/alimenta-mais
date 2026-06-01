import useAuth from "@/hooks/_useAuth";
import { FirestoreServiceError, listarDoacoes, reivindicarDoacao } from "@/services";
import { DonationDocumentWithId, DonationStatus } from "@/types";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { listarDoacoes } from "@/services";
import { DonationDocumentWithId } from "@/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { doc, getDoc } from "firebase/firestore";
import useAuth from "@/hooks/_useAuth";
import { db } from "@/services";

const LOCATION_PERMISSION_KEY = "@location_permission_granted";

const fallbackImage = require("@/assets/images/pao.jpg");
const baseCategories = ["Todas", "Prontos", "Frutas", "Verduras", "Pães"];

type Coordinates = {
  latitude: number;
  longitude: number;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const isNonEmpty = (value?: string | null): value is string =>
  Boolean(value && value.trim().length > 0);

const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  const precision = km < 10 ? 1 : 0;
  return `${km.toFixed(precision)} km`;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceMeters = (from: Coordinates, to: Coordinates) => {
  const earthRadius = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const buildLocationLabel = (
  address?: Location.LocationGeocodedAddress | null,
) => {
  if (!address) return "";

  const parts = [
    address.name,
    address.street,
    address.streetNumber,
    address.district,
    address.city,
    address.region,
  ].filter(isNonEmpty);

  return parts.join(", ");
};

type DonationCardItem = {
  id: string;
  title: string;
  weight: string;
  location: string;
  distanceMeters: number | null;
  distance: string;
  date: string;
  category: string;
  imageUri?: string | null;
  status: DonationStatus;
};

<<<<<<< HEAD
type DonationCardProps = Omit<DonationCardItem, "id" | "category" | "location" | "distanceMeters">;
=======
type DonationCardProps = Omit<DonationCardItem, "id" | "category"> & {
  onReivindicar?: () => void;
  reivindicando?: boolean;
};
>>>>>>> origin/main

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
    ) : status === "em análise" ? (
      <Box className="mt-3 bg-[#27272A] rounded-2xl h-10 items-center justify-center">
        <Text className="text-[#71717A] text-sm">Já reivindicada</Text>
      </Box>
    ) : null}
  </Box>
);

export default function Home() {
  const { user } = useAuth();
<<<<<<< HEAD
  const addressCoordsRef = useRef<Map<string, Coordinates | null>>(new Map());
  const lastGeocodedLocationRef = useRef<string | null>(null);

  const [locationModalMode, setLocationModalMode] = useState<
    "permission" | "selection" | null
  >(null);
  const [locationValue, setLocationValue] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [distanceByDonationId, setDistanceByDonationId] = useState<
    Record<string, number | null>
  >({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

=======
  const [showLocationModal, setShowLocationModal] = useState(false);
  
>>>>>>> origin/main
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
    const loadSavedAddresses = async () => {
      if (!user || !db) {
        setSavedAddresses([]);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          setSavedAddresses([]);
          return;
        }

        const data = snapshot.data() as {
          endereco?: string | null;
          enderecos?: string[] | null;
        };

        const addresses = [data.endereco, ...(data.enderecos ?? [])]
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(isNonEmpty);

        setSavedAddresses(Array.from(new Set(addresses)));
      } catch (error) {
        console.log("Erro ao carregar endereços do perfil:", error);
        setSavedAddresses([]);
      }
    };

    void loadSavedAddresses();
  }, [user?.uid]);

  useEffect(() => {
    const trimmedLocation = locationValue.trim();

    if (!trimmedLocation) {
      setUserCoords(null);
      return;
    }

    const lastLocation = lastGeocodedLocationRef.current;
    if (
      lastLocation &&
      normalizeText(lastLocation) === normalizeText(trimmedLocation) &&
      userCoords
    ) {
      return;
    }

    let active = true;

    const geocodeLocation = async () => {
      try {
        const [result] = await Location.geocodeAsync(trimmedLocation);

        if (!active) {
          return;
        }

        if (!result) {
          setUserCoords(null);
          setLocationError("Não foi possível localizar este endereço.");
          return;
        }

        setLocationError(null);
        setUserCoords({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        lastGeocodedLocationRef.current = trimmedLocation;
      } catch (error) {
        if (!active) {
          return;
        }
        console.log("Erro ao geocodificar endereço:", error);
        setUserCoords(null);
        setLocationError("Não foi possível localizar este endereço.");
      }
    };

    void geocodeLocation();

    return () => {
      active = false;
    };
  }, [locationValue, userCoords]);

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

  const loadGpsLocation = async (requestPermission: boolean) => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        if (requestPermission) {
          setLocationError("Permissão de localização negada.");
        }
        return;
      }

      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, "true");

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync(current.coords);
      const label = buildLocationLabel(address);

      if (!label) {
        setLocationError("Não foi possível identificar o endereço.");
        return;
      }

      setLocationValue(label);
      setLocationInput(label);
      setUserCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      lastGeocodedLocationRef.current = label;
    } catch (error) {
      console.log("Erro ao obter localização:", error);
      setLocationError("Não foi possível obter a localização.");
    } finally {
      setLocationLoading(false);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const alreadyAccepted = await AsyncStorage.getItem(
        LOCATION_PERMISSION_KEY,
      );

      const { status } = await Location.getForegroundPermissionsAsync();

      if (alreadyAccepted === "true" || status === "granted") {
        setLocationModalMode((current) =>
          current === "selection" ? current : null,
        );
        await loadGpsLocation(false);
        return;
      }

      await loadGpsLocation(true);

      const { status: updatedStatus } =
        await Location.getForegroundPermissionsAsync();

      setLocationModalMode((current) => {
        if (current === "selection") return current;
        return updatedStatus === "granted" ? null : "permission";
      });
    } catch (error) {
      console.log("Erro ao verificar localização:", error);
    }
  };

  const handleEnableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, "true");
        setLocationModalMode(null);
        await loadGpsLocation(false);
        return;
      }
      setLocationModalMode("permission");
    } catch (error) {
      console.log("Erro ao solicitar localização:", error);
    }
  };

<<<<<<< HEAD
  const handleOpenLocationModal = () => {
    setLocationError(null);
    setLocationInput(locationValue);
    setLocationModalMode("selection");
  };

  const handleApplyLocation = () => {
    setLocationValue(locationInput.trim());
    setLocationModalMode(null);
  };

  const resolveAddressCoords = async (address: string) => {
    const normalized = normalizeText(address);

    if (!normalized) {
      return null;
    }

    if (addressCoordsRef.current.has(normalized)) {
      return addressCoordsRef.current.get(normalized) ?? null;
    }

    try {
      const [result] = await Location.geocodeAsync(address);
      if (!result) {
        addressCoordsRef.current.set(normalized, null);
        return null;
      }

      const coords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };
      addressCoordsRef.current.set(normalized, coords);
      return coords;
    } catch (error) {
      console.log("Erro ao geocodificar doação:", error);
      addressCoordsRef.current.set(normalized, null);
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    const loadDistances = async () => {
      if (!userCoords || donations.length === 0) {
        if (active) {
          setDistanceByDonationId({});
        }
        return;
      }

      const entries = await Promise.all(
        donations.map(async (donation) => {
          const hasCoords =
            typeof donation.latitude === "number" &&
            typeof donation.longitude === "number";

          const coords = hasCoords
            ? {
                latitude: donation.latitude as number,
                longitude: donation.longitude as number,
              }
            : donation.localizacao
              ? await resolveAddressCoords(donation.localizacao)
              : null;

          const distance = coords
            ? calculateDistanceMeters(userCoords, coords)
            : null;

          return [donation.id, distance] as const;
        }),
      );

      if (active) {
        setDistanceByDonationId(Object.fromEntries(entries));
      }
    };

    void loadDistances();

    return () => {
      active = false;
    };
  }, [donations, userCoords]);
=======
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
            ? { ...d, status: "em análise", reivindicadoPor: user.uid }
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
>>>>>>> origin/main

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
        location: donation.localizacao ?? "",
        distanceMeters: distanceByDonationId[donation.id] ?? null,
        distance:
          distanceByDonationId[donation.id] !== null &&
          distanceByDonationId[donation.id] !== undefined
            ? `${formatDistance(distanceByDonationId[donation.id] as number)} de você`
            : donation.localizacao
              ? `Local: ${donation.localizacao}`
              : "Localização não informada",
        date: donation.validade,
        category: donation.categoria,
        imageUri: donation.fotos?.[0]?.secureUrl ?? null,
        status: donation.status,
      })),
    [donations, distanceByDonationId]
  );

  const filteredDonations = useMemo(() => {
    const searchTerm = normalizeText(search);

    const filtered = donationCards.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas"
          ? true
          : item.category === selectedCategory;

      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm) ||
        item.weight.toLowerCase().includes(searchTerm) ||
        item.distance.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const distanceA = a.distanceMeters ?? Number.POSITIVE_INFINITY;
      const distanceB = b.distanceMeters ?? Number.POSITIVE_INFINITY;

      if (distanceA === distanceB) {
        return a.title.localeCompare(b.title);
      }

      return distanceA - distanceB;
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

        {/* Categories + localização */}
        <Box className="h-12 mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ alignItems: "center" }}
          >
            <Button
              onPress={handleOpenLocationModal}
              className="bg-[#1E3A0A] mr-2 px-4 rounded-xl h-10 border-0 items-center justify-center"
            >
              <FontAwesome5 name="location-arrow" size={16} color="#84CC16" />
            </Button>

            {categories.map((cat) => {
              return (
                <Button
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`${
                    isSelected ? "bg-[#1E3A0A]" : "bg-[#27272A]"
                  } mr-2 px-6 rounded-xl h-10 border-0 items-center justify-center`}
                >
                  <ButtonText
                    className={`${
                      isSelected ? "text-[#84CC16] font-bold" : "text-gray-300"
                    } text-center text-sm`}
                  >
                    {cat}
                  </ButtonText>
                </Button>
              );
            })}
          </ScrollView>
        </Box>

        {/* Localização vigente */}
        <TouchableOpacity
          onPress={handleOpenLocationModal}
          className="flex-row items-center mb-3"
        >
          <FontAwesome5 name="map-marker-alt" size={12} color="#65A30D" />
          <Text
            className="text-[#A1A1AA] text-[13px] ml-2 flex-1"
            numberOfLines={1}
          >
            {locationValue.trim()
              ? locationValue.trim()
              : userCoords
                ? "Usando localização atual"
                : "Toque para definir sua localização"}
          </Text>
          <FontAwesome5 name="chevron-right" size={10} color="#71717A" />
        </TouchableOpacity>

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
      <Modal
        visible={locationModalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalMode(null)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <Pressable className="absolute inset-0" onPress={() => setLocationModalMode(null)} />

          <View className="bg-[#18181B] border border-[#27272A] rounded-[28px] overflow-hidden">
            <View className="items-center pt-6">
              <View className="bg-[#1E3A0A] w-16 h-16 rounded-full items-center justify-center mb-4">
                <FontAwesome5
                  name={
                    locationModalMode === "permission"
                      ? "map-marker-alt"
                      : "location-arrow"
                  }
                  size={24}
                  color="#84CC16"
                />
              </View>
            </View>

            <View className="px-6 pb-2">
              {locationModalMode === "permission" ? (
                <>
                  <Text className="text-white text-xl font-bold text-center mb-3">
                    Habilitar localização
                  </Text>

                  <Text className="text-[#A1A1AA] text-center leading-6">
                    Precisamos da sua localização para mostrar doações próximas de
                    você em tempo real.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-xl font-bold text-center mb-3">
                    Sua localização
                  </Text>

                  <Text className="text-[#A1A1AA] text-center leading-6">
                    Use o GPS ou digite outro endereço.
                  </Text>

                  <View className="flex-row items-center bg-black/30 rounded-2xl px-4 h-12 border border-[#27272A] mt-4">
                    <FontAwesome5 name="map-marker-alt" size={16} color="#65A30D" />
                    <TextInput
                      value={locationInput}
                      onChangeText={setLocationInput}
                      placeholder="Ex: Centro, Fortaleza - CE"
                      placeholderTextColor="#71717A"
                      keyboardType="default"
                      autoCapitalize="words"
                      autoCorrect={false}
                      className="flex-1 text-white ml-3 text-[16px]"
                      style={{ fontFamily: "System" }}
                    />
                  </View>

                  <Pressable
                    onPress={() => loadGpsLocation(true)}
                    className="bg-[#1E3A0A] w-full rounded-2xl h-12 mt-4 border border-[#2B5718] items-center justify-center"
                  >
                    <Text className="text-[#84CC16] font-semibold">
                      {locationLoading ? "Carregando..." : "Usar GPS"}
                    </Text>
                  </Pressable>

                  {savedAddresses.length > 0 && (
                    <View className="mt-4">
                      <Text className="text-[#A1A1AA] text-sm mb-2">
                        Endereços salvos
                      </Text>
                      {savedAddresses.map((address) => {
                        const isSelected =
                          normalizeText(address) === normalizeText(locationInput);
                        return (
                          <Pressable
                            key={address}
                            onPress={() => setLocationInput(address)}
                            className={`rounded-2xl border px-4 py-3 mb-2 ${
                              isSelected
                                ? "border-[#65A30D] bg-[#1B2A12]"
                                : "border-[#27272A] bg-[#111312]"
                            }`}
                          >
                            <Text className="text-white text-sm">{address}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {locationError && (
                    <Text className="text-[#F87171] text-center mt-3 text-sm">
                      {locationError}
                    </Text>
                  )}

                  <Pressable
                    onPress={handleApplyLocation}
                    className="bg-[#65A30D] w-full rounded-2xl h-12 mt-4 items-center justify-center"
                  >
                    <Text className="text-white font-semibold">
                      Aplicar localização
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            <View className="flex-col pb-6 pt-4 px-6">
              {locationModalMode === "permission" ? (
                <>
                  <Pressable
                    onPress={handleEnableLocation}
                    className="bg-[#65A30D] w-full rounded-2xl h-12 mb-3 items-center justify-center"
                  >
                    <Text className="text-white font-semibold">
                      Permitir acesso
                    </Text>
                  </Pressable>

                  <TouchableOpacity onPress={() => setLocationModalMode(null)}>
                    <Text className="text-[#A1A1AA] text-center">Agora não</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => setLocationModalMode(null)}>
                  <Text className="text-[#A1A1AA] text-center">Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

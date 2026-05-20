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
import { Image, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const categories = ["Todas", "Frutas", "Verduras", "Pães"];

const LOCATION_PERMISSION_KEY = "@location_permission_granted";

const donations = [
  {
    id: 1,
    title: "Pães frescos",
    weight: "1kg de pães",
    distance: "2,3 km",
    date: "20/04",
    category: "Pães",
    imageUri:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300",
  },
  {
    id: 2,
    title: "Frutas variadas",
    weight: "2kg de frutas",
    distance: "1,8 km",
    date: "21/04",
    category: "Frutas",
    imageUri:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300",
  },
  {
    id: 3,
    title: "Refeição pronta",
    weight: "Marmitex",
    distance: "2,7 km",
    date: "20/04",
    category: "Pães",
    imageUri:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300",
  },
  {
    id: 4,
    title: "Legumes variados",
    weight: "2kg de legumes",
    distance: "2,0 km",
    date: "19/04",
    category: "Verduras",
    imageUri:
      "https://images.unsplash.com/photo-1566385101042-1a000c1267c4?q=80&w=300",
  },
];

const DonationCard = ({ title, weight, distance, date, imageUri }: any) => (
  <Box className="bg-[#141416] rounded-[24px] p-3 mb-3 flex-row items-center border border-[#1E1E21]">
    <Image
      source={{ uri: imageUri }}
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
  </Box>
);

export default function Home() {
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  useEffect(() => {
    checkLocationPermission();
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

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas"
          ? true
          : item.category === selectedCategory;

      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.weight.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F0C]">
      <Box className="flex-1 bg-[#09090B] pt-12 px-4">
        {/* Header */}
        <HStack className="flex-row items-center justify-between mb-6">
          <TouchableOpacity>
            <FontAwesome5 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-semibold">
            Buscar doações
          </Text>

          <Box className="w-6" />
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
              const isSelected = selectedCategory === cat;

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
          {filteredDonations.length > 0 ? (
            filteredDonations.map((item) => (
              <DonationCard
                key={item.id}
                title={item.title}
                weight={item.weight}
                distance={item.distance}
                date={item.date}
                imageUri={item.imageUri}
              />
            ))
          ) : (
            <Box className="items-center justify-center mt-20">
              <Box className="bg-[#18181B] w-20 h-20 rounded-full items-center justify-center mb-4">
                <FontAwesome5 name="search" size={28} color="#71717A" />
              </Box>

              <Text className="text-white text-lg font-semibold mb-2">
                Nenhuma doação encontrada
              </Text>

              <Text className="text-[#71717A] text-center px-8">
                Tente pesquisar outro alimento ou mudar a categoria.
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

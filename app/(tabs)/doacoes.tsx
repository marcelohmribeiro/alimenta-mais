import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Doacao = {
  id: string;
  titulo: string;
  categoria: string;
  quantidade: string;
  distancia: string;
  validade: string;
  imagem: any;
};

const categorias = ["Todas", "Frutas", "Verduras", "Pães", "Prontas"];

const doacoes: Doacao[] = [
  {
    id: "1",
    titulo: "Pães frescos",
    categoria: "Pães",
    quantidade: "1kg de pães",
    distancia: "2,3 km",
    validade: "20/04",
    imagem: require("../../assets/images/pao.jpg")  },
  {
    id: "2",
    titulo: "Frutas variadas",
    categoria: "Frutas",
    quantidade: "2kg de frutas",
    distancia: "1,8 km",
    validade: "21/04",
    imagem: { uri: "https://via.placeholder.com/150" }  },
  {
    id: "3",
    titulo: "Refeição pronta",
    categoria: "Prontas",
    quantidade: "Marmitex",
    distancia: "2,7 km",
    validade: "20/04",
    imagem: { uri: "https://via.placeholder.com/150" }  },
  {
    id: "4",
    titulo: "Legumes variados",
    categoria: "Verduras",
    quantidade: "2kg de legumes",
    distancia: "1,5 km",
    validade: "19/04",
    imagem: { uri: "https://via.placeholder.com/150" }  },
];

export default function Doacoes() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [busca, setBusca] = useState("");

  const listaFiltrada = doacoes.filter((item) => {
    const porCategoria =
      categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;

    const porBusca = item.titulo.toLowerCase().includes(busca.toLowerCase());

    return porCategoria && porBusca;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#000000]">
      <View className="flex-1 px-5 pt-4">
        <Text
          className="text-white text-center mb-6"
          style={{
            fontSize: 26,
            fontWeight: "bold",
          }}
        >
          Buscar doações
        </Text>

        {/* BUSCA */}
        <View className="flex-row items-center gap-3 mb-5">
          <View className="flex-1 flex-row items-center h-[56px] bg-[#0A0A0A] border border-[#27272A] rounded-2xl px-4">
            <Ionicons name="search-outline" size={22} color="#6FC72C" />
            <TextInput
              placeholder="Buscar alimentos..."
              placeholderTextColor="#71717A"
              value={busca}
              onChangeText={setBusca}
              className="flex-1 text-white ml-3"
            />
          </View>

          <TouchableOpacity className="w-[56px] h-[56px] rounded-2xl bg-[#0A0A0A] border border-[#27272A] items-center justify-center">
            <Ionicons name="filter-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* CATEGORIAS */}
        <View className="mb-5">
          <FlatList
            horizontal
            data={categorias}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => {
              const ativo = categoriaAtiva === item;

              return (
                <TouchableOpacity onPress={() => setCategoriaAtiva(item)}>
                  {ativo ? (
                    <LinearGradient
                      colors={["#5ED62A", "#33A61A"]}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 16,
                      }}
                    >
                      <Text className="text-white font-semibold">
                        {item}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View className="px-4 py-3 rounded-2xl bg-[#0A0A0A] border border-[#27272A]">
                      <Text className="text-[#A1A1AA] font-semibold">
                        {item}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* LISTA */}
        <FlatList
          data={listaFiltrada}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-3 mb-4">
              <Image
                source={item.imagem}
                className="w-20 h-20 rounded-xl"              />

              <View className="flex-1 ml-4 justify-center">
                <Text className="text-white text-lg font-bold">
                  {item.titulo}
                </Text>

                <Text className="text-[#A1A1AA] mt-1">
                  {item.quantidade}
                </Text>

                <View className="flex-row items-center mt-3">
                  <Ionicons name="location-outline" size={16} color="#6FC72C" />
                  <Text className="text-[#A1A1AA] ml-2">
                    {item.distancia}
                  </Text>
                </View>

                <View className="flex-row items-center mt-2">
                  <Ionicons name="calendar-outline" size={16} color="#6FC72C" />
                  <Text className="text-[#A1A1AA] ml-2">
                    Validade: {item.validade}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* BOTÃO + */}
        <TouchableOpacity className="absolute bottom-8 right-5">
          <LinearGradient
            colors={["#5ED62A", "#33A61A"]}
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={36} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Text,
  VStack
} from '@gluestack-ui/themed';
import React from 'react';
import { Image, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["Todas", "Frutas", "Verduras", "Pães"];
const DonationCard = ({ title, weight, distance, date, imageUri }: any) => (
  <Box className="bg-[#141416] rounded-[24px] p-3 mb-3 flex-row items-center border border-[#1E1E21]">
    {/* Imagem com bordas mais suaves */}
    <Image 
      source={{ uri: imageUri }} 
      className="w-[100px] h-[100px] rounded-[20px]" 
      resizeMode="cover"
    />
    
    <VStack className="ml-4 flex-1 items-start">
      {/* Título com peso de fonte semibold e cor branca pura */}
      <Text className="text-white font-semibold text-lg leading-tight mb-0.5">
        {title}
      </Text>
      
      {/* Subtítulo mais acinzentado */}
      <Text className="text-[#A1A1AA] text-sm mb-2">
        {weight}
      </Text>
      
      {/* Localização - Ícone MapPin estilo Outline */}
      <HStack className="flex flex-row items-center mb-1">
        <FontAwesome5 name="map-marker-alt" size={12} color="#65A30D" />
        <Text className="text-[#A1A1AA] text-[13px] ml-2">
          {distance}
        </Text>
      </HStack>
      
      {/* Validade - Ícone de Relógio/Calendário Outline */}
      <HStack className="flex flex-row items-center">
        <FontAwesome5 name="clock" size={12} color="#65A30D" />
        <Text className="text-[#A1A1AA] text-[13px] ml-2">
          Validade: {date}
        </Text>
      </HStack>
    </VStack>
  </Box>
);

export default function Home() {
  return (
    // <TabPlaceholder
    //   title="Início"
    //   subtitle="Visão geral do seu app de doações e impacto social."
    //   icon="home-outline"
    // />
    <SafeAreaView className="flex-1 bg-[#0B0F0C]">
      <Box className="flex-1 bg-[#09090B] pt-12 px-4">
        {/* Header */}
        <HStack className="flex flex-row items-center justify-between mb-6">
          <TouchableOpacity>
            <FontAwesome5 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Buscar doações</Text>
          <Box className="w-6" /> 
        </HStack>

        {/* Search Bar */}
        <HStack className="flex flex-row items-center mb-6">
          <FontAwesome5 name="search" size={16} color="#A1A1AA" />
          <TextInput
            placeholder="arroz"
            placeholderTextColor="#71717A"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-white bg-black/30 p-2 rounded-xl ml-3 text-[16px] font-normal"
            style={{ fontFamily: "System" }}
          />
          <Box className="ml-3 bg-[#1C1C1E] p-3 rounded-xl w-12 h-12 items-center justify-center">
            <FontAwesome5 name="sliders-h" size={18} color="white" />
          </Box>
        </HStack>

        {/* Categories */}
        <Box className="h-12 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, index) => (
              <Button 
                key={cat} 
                /* Adicionado: items-center e justify-center */
                className={`${
                  index === 0 ? 'bg-[#1E3A0A]' : 'bg-[#27272A]'
                } mr-2 px-6 rounded-xl h-10 border-0 items-center justify-center`}
              >
                <ButtonText 
                  /* Adicionado: text-center */
                  className={`${
                    index === 0 ? 'text-[#84CC16] font-bold' : 'text-gray-300'
                  } text-center text-sm`}
                >
                  {cat}
                </ButtonText>
              </Button>
            ))}
          </ScrollView>
        </Box>

        {/* Donation List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <DonationCard 
            title="Pães frescos" 
            weight="1kg de pães" 
            distance="2,3 km" 
            date="20/04" 
            imageUri="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300"
          />
          <DonationCard 
            title="Frutas variadas" 
            weight="2kg de frutas" 
            distance="1,8 km" 
            date="21/04" 
            imageUri="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300"
          />
          <DonationCard 
            title="Refeição pronta" 
            weight="Marmitex" 
            distance="2,7 km" 
            date="20/04" 
            imageUri="https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300"
          />
          <DonationCard 
            title="Legumes variados" 
            weight="2kg de legumes" 
            distance="2,0 km" 
            date="19/04" 
            imageUri="https://images.unsplash.com/photo-1566385101042-1a000c1267c4?q=80&w=300"
          />
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}

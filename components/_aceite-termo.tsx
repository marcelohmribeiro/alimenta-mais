import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

const accent = "#65C90F";

export interface TermoSecao {
  titulo: string;
  paragrafo: string;
  itens?: string[];
}

export interface Termo {
  /** Nome do termo, exibido no header do modal. */
  titulo: string;
  /** Texto introdutório opcional, exibido antes das seções. */
  introducao?: string;
  secoes: TermoSecao[];
}

interface AceiteTermoProps {
  termo: Termo;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Texto do link que abre o modal. */
  linkLabel?: string;
  /** Texto da pergunta ao lado do toggle. */
  perguntaLabel?: string;
}

const AceiteTermo: React.FC<AceiteTermoProps> = ({
  termo,
  value,
  onValueChange,
  disabled = false,
  linkLabel = "Ver Termo de Consentimento",
  perguntaLabel = "Estou ciente e concordo com o Termo de Consentimento",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-8">
      {/* LINK PARA ABRIR O TERMO */}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        hitSlop={8}
        className="flex-row items-center mb-4"
        style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.7 : 1 })}
      >
        <Ionicons name="document-text-outline" size={20} color={accent} />
        <Text className="ml-2 text-[15px] font-semibold" style={{ color: accent }}>
          {linkLabel}
        </Text>
      </Pressable>

      {/* PERGUNTA + TOGGLE */}
      <View className="flex-row items-center justify-between rounded-[18px] border border-white/5 bg-[#101514] px-4 py-4">
        <Text className="flex-1 pr-3 text-[14px] leading-5 text-white">
          {perguntaLabel}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#1F2A18", true: "rgba(101,201,15,0.4)" }}
          thumbColor={value ? accent : "#A1A1AA"}
          ios_backgroundColor="#1F2A18"
        />
      </View>

      {/* MODAL COM O TERMO COMPLETO */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/70 px-5">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />

          <View
            className="overflow-hidden rounded-[24px] border border-[#1F2937] bg-[#000000]"
            style={{ maxHeight: "85%" }}
          >
            {/* HEADER */}
            <View className="flex-row items-center justify-between border-b border-[#1F2A18] bg-[#071007] px-5 py-4">
              <View className="flex-1 flex-row items-center pr-3">
                <Ionicons name="document-text-outline" size={20} color={accent} />
                <Text className="ml-2 text-[17px] font-semibold text-white">
                  {termo.titulo}
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#A3A3A3" />
              </Pressable>
            </View>

            {/* CONTEÚDO */}
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 18 }}
              showsVerticalScrollIndicator={false}
            >
              {termo.introducao ? (
                <Text className="mb-5 text-[13px] leading-5 text-[#A1A1AA]">
                  {termo.introducao}
                </Text>
              ) : null}

              {termo.secoes.map((secao) => (
                <View key={secao.titulo} className="mb-5">
                  <Text className="mb-2 text-[15px] font-semibold text-white">
                    {secao.titulo}
                  </Text>
                  <Text className="text-[14px] leading-6 text-[#E5E7EB]">
                    {secao.paragrafo}
                  </Text>

                  {secao.itens?.map((item) => (
                    <View key={item} className="mt-2 flex-row">
                      <Text className="mr-2 text-[14px] font-semibold" style={{ color: accent }}>
                        •
                      </Text>
                      <Text className="flex-1 text-[14px] leading-6 text-[#E5E7EB]">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            {/* AÇÃO */}
            <View className="border-t border-[#1F2A18] px-5 py-4">
              <Pressable
                onPress={() => setOpen(false)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <LinearGradient
                  colors={["#7DE11B", "#58B50B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 52,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[15px] font-semibold text-[#081106]">
                    Entendi
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AceiteTermo;
export { AceiteTermo };

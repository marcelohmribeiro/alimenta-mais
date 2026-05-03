import { auth, db } from "@/services/_firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CadastrarDoacao() {
  const [tipoAlimento, setTipoAlimento] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [validade, setValidade] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");
  const [perecivel, setPerecivel] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const validarCampos = () => {
    if (!tipoAlimento.trim()) return "Informe o tipo de alimento.";
    if (!quantidade.trim()) return "Informe a quantidade.";
    if (!descricao.trim()) return "Informe a descrição.";
    if (!validade.trim()) return "Informe a validade.";
    if (!localizacao.trim()) return "Informe a localização.";
    if (!disponibilidade.trim()) return "Informe a disponibilidade.";
    return null;
  };

  const salvarDoacao = async () => {
    const erro = validarCampos();

    if (erro) {
      Alert.alert("Campos obrigatórios", erro);
      return;
    }

    if (!db) {
      Alert.alert("Erro", "Firebase não está configurado.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "donations"), {
        tipoAlimento: tipoAlimento.trim(),
        quantidade: quantidade.trim(),
        descricao: descricao.trim(),
        validade: validade.trim(),
        localizacao: localizacao.trim(),
        disponibilidade: disponibilidade.trim(),
        perecivel,
        observacoes: observacoes.trim(),
        status: "disponivel",
        donorId: auth?.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sucesso", "Doação cadastrada com sucesso!");
      router.push("/(tabs)/doacoes");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível cadastrar a doação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#000000]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-6 pt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-2xl bg-[#0A0A0A] border border-[#27272A] items-center justify-center mb-5"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-white text-[28px] font-bold">
              Cadastrar doação
            </Text>

            <Text className="text-[#A1A1AA] text-[15px] mt-2 mb-7">
              Preencha os dados do alimento disponível.
            </Text>

            <Campo
              label="Tipo de alimento"
              value={tipoAlimento}
              onChangeText={setTipoAlimento}
              placeholder="Ex: Pães, frutas, marmitas..."
            />

            <Campo
              label="Quantidade"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="Ex: 2kg, 5 unidades..."
            />

            <Campo
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva o alimento"
              multiline
            />

            <Campo
              label="Validade"
              value={validade}
              onChangeText={setValidade}
              placeholder="Ex: 20/04/2026"
            />

            <Campo
              label="Localização"
              value={localizacao}
              onChangeText={setLocalizacao}
              placeholder="Ex: Rua das Flores, 123"
            />

            <Campo
              label="Disponibilidade"
              value={disponibilidade}
              onChangeText={setDisponibilidade}
              placeholder="Ex: Hoje das 14h às 18h"
            />

            <View className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl px-4 py-4 mb-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white text-[15px] font-semibold">
                    Alimento perecível
                  </Text>
                  <Text className="text-[#A1A1AA] text-[13px] mt-1">
                    Marque se precisa de retirada rápida.
                  </Text>
                </View>

                <Switch
                  value={perecivel}
                  onValueChange={setPerecivel}
                  trackColor={{ false: "#27272A", true: "#3F7F2C" }}
                  thumbColor={perecivel ? "#6FC72C" : "#A1A1AA"}
                />
              </View>
            </View>

            <Campo
              label="Observações"
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ex: retirar na portaria"
              multiline
              obrigatorio={false}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={salvarDoacao}
              className="mt-3"
            >
              <LinearGradient
                colors={loading ? ["#3F7F2C", "#2B641F"] : ["#5ED62A", "#33A61A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[17px] font-semibold">
                    Publicar doação
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  obrigatorio = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  obrigatorio?: boolean;
}) {
  return (
    <View className="mb-5">
      <Text className="text-white text-sm font-medium mb-2 ml-1">
        {label}
        {obrigatorio ? <Text className="text-[#6FC72C]"> *</Text> : null}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71717A"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className="text-white bg-[#0A0A0A] border border-[#27272A] rounded-2xl px-4 text-[16px]"
        style={{
          minHeight: multiline ? 96 : 56,
          paddingTop: multiline ? 14 : 0,
        }}
      />
    </View>
  );
}
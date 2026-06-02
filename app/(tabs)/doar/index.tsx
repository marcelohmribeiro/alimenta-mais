import useAuth from "@/hooks/_useAuth";
import {
  CloudinaryServiceError,
  FirestoreServiceError,
  salvarDoacao,
  verificarSeUsuarioEhDoador,
} from "@/services";
import { useLoading } from "@/store";
import { DonationPhotoInput } from "@/types";
import { dataValida, formatarData, formatarHorario } from "@/utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GREEN = "#65C90F";

export default function DoarScreen() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState<DonationPhotoInput[]>([]);
  const [nomeAlimento, setNomeAlimento] = useState("");
  const [categoria, setCategoria] = useState("Prontos");
  const [quantidade, setQuantidade] = useState("");
  const [tipoAlimento, setTipoAlimento] = useState("Não perecível");
  const [validade, setValidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [retirada, setRetirada] = useState<"doador" | "buscador">("doador");
  const [dataRetirada, setDataRetirada] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [endereco, setEndereco] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const [ehDoador, setEhDoador] = useState(false);

  useEffect(() => {
    const verificarDoador = async () => {
      startLoading();
      try {
        setEhDoador(await verificarSeUsuarioEhDoador(user?.uid));
      } catch (error) {
        console.log("ERRO AO VALIDAR DOADOR:", error);
        setEhDoador(false);
      } finally {
        stopLoading();
      }
    };

    verificarDoador();
  }, [user?.uid]);

  const adicionarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const novasFotos = result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        file: asset.file,
      }));
      setFotos((atual) => [...atual, ...novasFotos].slice(0, 3));
    }
  };

  const removerFoto = (index: number) => {
    setFotos((atual) => atual.filter((_, i) => i !== index));
  };

  const validarCampos = () => {
    if (!nomeAlimento.trim()) return "Informe o nome do alimento.";
    if (!categoria.trim()) return "Informe a categoria.";
    if (!quantidade.trim()) return "Informe a quantidade.";
    if (!tipoAlimento.trim()) return "Informe o tipo do alimento.";
    if (!validade.trim()) return "Informe a validade.";
    if (validade.length !== 10) return "Informe a validade no formato DD/MM/AAAA.";
    if (!dataValida(validade)) return "Informe uma validade real e que não esteja vencida.";
    if (!dataRetirada.trim()) return "Informe a data disponível para retirada.";
    if (dataRetirada.length !== 10) return "Informe a data de retirada no formato DD/MM/AAAA.";
    if (!dataValida(dataRetirada)) return "Informe uma data de retirada real e que não esteja vencida.";
    if (!horarioInicio.trim()) return "Informe o horário inicial.";
    if (horarioInicio.length !== 5) return "Informe o horário inicial no formato HH:MM.";
    if (!horarioFim.trim()) return "Informe o horário final.";
    if (horarioFim.length !== 5) return "Informe o horário final no formato HH:MM.";
    if (!endereco.trim()) return "Informe o endereço de retirada.";
    if (!aceitouTermos) return "Aceite os termos e condições para continuar.";
    return null;
  };

  const limparFormulario = () => {
    setFotos([]);
    setNomeAlimento("");
    setCategoria("Prontos");
    setQuantidade("");
    setTipoAlimento("Não perecível");
    setValidade("");
    setDescricao("");
    setRetirada("doador");
    setDataRetirada("");
    setHorarioInicio("");
    setHorarioFim("");
    setEndereco("");
    setAceitouTermos(false);
  };

  const handleSalvarDoacao = async () => {
    const erro = validarCampos();

    if (erro) {
      Alert.alert("Campos obrigatórios", erro);
      return;
    }

    try {
      setLoading(true);
      await salvarDoacao({
        userId: user?.uid ?? null,
        fotos,
        nomeAlimento,
        categoria,
        quantidade,
        tipoAlimento,
        validade,
        descricao,
        retirada,
        dataRetirada,
        horarioInicio,
        horarioFim,
        endereco,
      });
      limparFormulario();
      Alert.alert("Sucesso", "Doação cadastrada com sucesso!");
    } catch (error) {
      console.log("ERRO AO CADASTRAR DOAÇÃO:", error);
      const mensagem =
        error instanceof FirestoreServiceError ||
        error instanceof CloudinaryServiceError
          ? error.message
          : "Não foi possível cadastrar a doação. Veja o console.";

      Alert.alert("Erro", mensagem);
    } finally {
      setLoading(false);
    }
  };


  if (!ehDoador) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F0C] items-center justify-center px-6">
        <MaterialCommunityIcons name="shield-lock-outline" size={70} color="#65C90F" />

        <Text className="text-white text-2xl font-bold mt-6 text-center">
          Área exclusiva para doadores
        </Text>

        <Text className="text-[#A3A3A3] text-center mt-3">
          Você precisa se cadastrar como doador antes de criar uma doação.
        </Text>

        <Pressable
          onPress={() => {
            console.log("CLICOU EM TORNAR-SE DOADOR");
            router.push("/(tabs)/become-donor" as any);
          }}
          className="bg-[#65C90F] mt-8 px-6 py-4 rounded-2xl"
        >
          <Text className="text-[#081106] font-bold">Tornar-se doador</Text>
        </Pressable>
              </SafeAreaView>
            );
          }

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F0C]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          <View className="px-5 pt-5">
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-white text-3xl font-bold">
                  Cadastrar doação
                </Text>
                <Text className="text-[#A3A3A3] text-[14px] mt-1">
                  Preencha as informações sobre o alimento.
                </Text>
              </View>

              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={18}
                  color={GREEN}
                />
                <Text className="text-[#A3A3A3] text-[13px] ml-1">
                  Ambiente seguro
                </Text>
              </View>
            </View>

            <Section title="Fotos do alimento" subtitle="Adicione fotos reais do alimento">
              <View className="flex-row gap-3">
                {fotos.map((foto, index) => (
                  <View key={`${foto.uri}-${index}`} className="relative">
                    <Image
                      source={{ uri: foto.uri }}
                      className="w-[92px] h-[92px] rounded-2xl"
                    />
                    <TouchableOpacity
                      onPress={() => removerFoto(index)}
                      className="absolute -top-2 -right-2 bg-[#1F2937] w-7 h-7 rounded-full items-center justify-center"
                    >
                      <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {fotos.length < 3 && (
                  <TouchableOpacity
                    onPress={adicionarFoto}
                    className="w-[92px] h-[92px] rounded-2xl border border-dashed border-[#365a25] items-center justify-center bg-[#101810]"
                  >
                    <MaterialCommunityIcons
                      name="camera-outline"
                      size={28}
                      color={GREEN}
                    />
                    <Text className="text-[#A3A3A3] text-[12px] mt-2">
                      Adicionar foto
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Section>

            <Section title="Informações do alimento">
              <Campo
                label="Nome do alimento"
                value={nomeAlimento}
                onChangeText={setNomeAlimento}
                placeholder="Ex: Refeição pronta"
                maxLength={60}
              />

              <View className="flex-row gap-3">
                <SelectBox
                  label="Categoria"
                  value={categoria}
                  icon="silverware-fork-knife"
                  options={["Prontos", "Frutas", "Verduras", "Pães"]}
                  onChange={setCategoria}
                />

                <Campo
                  label="Quantidade"
                  value={quantidade}
                  onChangeText={setQuantidade}
                  placeholder="Ex: 1,5 kg"
                  icon="weight-kilogram"
                  containerClassName="flex-1"
                />
              </View>

              <View className="flex-row gap-3">
                <SelectBox
                  label="Tipo de alimento"
                  value={tipoAlimento}
                  icon="leaf"
                  options={["Perecível", "Não perecível"]}
                  onChange={setTipoAlimento}
                />

                <Campo
                  label="Validade"
                  value={validade}
                  onChangeText={(text) => setValidade(formatarData(text))}
                  placeholder="DD/MM/AAAA"
                  icon="calendar-outline"
                  keyboardType="numeric"
                  maxLength={10}
                  containerClassName="flex-1"
                />
              </View>

              <Campo
                label="Descrição"
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descreva detalhes do alimento"
                multiline
                obrigatorio={false}
                maxLength={200}
              />
            </Section>

            <Section title="Retirada">
              <View className="flex-row gap-3 mb-4">
                <OptionCard
                  active={retirada === "doador"}
                  icon="account-group-outline"
                  title="Retirada pelo doador"
                  subtitle="Eu levo até o local"
                  onPress={() => setRetirada("doador")}
                />

                <OptionCard
                  active={retirada === "buscador"}
                  icon="car-outline"
                  title="Buscador retira"
                  subtitle="O buscador vem até mim"
                  onPress={() => setRetirada("buscador")}
                />
              </View>

              <Campo
                label="Data disponível"
                value={dataRetirada}
                onChangeText={(text) => setDataRetirada(formatarData(text))}
                placeholder="DD/MM/AAAA"
                icon="calendar-outline"
                keyboardType="numeric"
                maxLength={10}
              />

              <View className="flex-row gap-3">
                <Campo
                  label="De"
                  value={horarioInicio}
                  onChangeText={(text) => setHorarioInicio(formatarHorario(text))}
                  placeholder="18:00"
                  icon="clock-outline"
                  keyboardType="numeric"
                  maxLength={5}
                  containerClassName="flex-1"
                />

                <Campo
                  label="Até"
                  value={horarioFim}
                  onChangeText={(text) => setHorarioFim(formatarHorario(text))}
                  placeholder="22:00"
                  icon="clock-outline"
                  keyboardType="numeric"
                  maxLength={5}
                  containerClassName="flex-1"
                />
              </View>

              <Campo
                label="Endereço de retirada"
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, número, bairro e cidade"
                icon="map-marker-outline"
              />
            </Section>

            <Section title="Informações adicionais">
              <TouchableOpacity
                onPress={() => setAceitouTermos((atual) => !atual)}
                className="flex-row items-center justify-between bg-[#111827] border border-[#1F2937] rounded-2xl px-4 py-4"
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-7 h-7 rounded-lg items-center justify-center mr-3 ${
                      aceitouTermos ? "bg-[#65C90F]" : "bg-[#0B0F0C]"
                    }`}
                  >
                    {aceitouTermos && (
                      <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    )}
                  </View>

                  <Text className="text-[#D4D4D4] flex-1">
                    Aceito os{" "}
                    <Text className="text-[#65C90F] font-semibold">
                      termos e condições
                    </Text>{" "}
                    da plataforma
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color="#A3A3A3" />
              </TouchableOpacity>
            </Section>

            <Pressable
  disabled={loading}
  onPress={() => {
    console.log("CLICOU NO BOTÃO");
    handleSalvarDoacao();
  }}
  style={{
    marginTop: 8,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#65C90F",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {loading ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text
      style={{
        color: "#081106",
        fontSize: 20,
        fontWeight: "bold",
      }}
    >
      Cadastrar doação
    </Text>
  )}
</Pressable>

            <View className="flex-row justify-center items-center mt-4">
              <MaterialCommunityIcons name="lock-outline" size={16} color={GREEN} />
              <Text className="text-[#A3A3A3] text-[13px] ml-2">
                Seus dados estão protegidos com segurança
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-[#0F1512] border border-[#1F2937] rounded-3xl p-4 mb-4">
      <Text className="text-white text-[20px] font-bold">{title}</Text>
      {subtitle && (
        <Text className="text-[#A3A3A3] text-[14px] mt-1 mb-4">{subtitle}</Text>
      )}
      {!subtitle && <View className="h-4" />}
      {children}
    </View>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  obrigatorio = true,
  keyboardType = "default",
  maxLength,
  containerClassName = "",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  multiline?: boolean;
  obrigatorio?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
  containerClassName?: string;
}) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="text-[#A3A3A3] text-[13px] font-semibold mb-2">
        {label}
        {obrigatorio ? <Text className="text-[#65C90F]"> *</Text> : null}
      </Text>

      <View className="flex-row bg-[#111827] border border-[#1F2937] rounded-2xl px-4">
        {icon && (
          <View
            className="mr-3"
            style={{
              height: 56,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <MaterialCommunityIcons name={icon} size={20} color="#65C90F" />
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          maxLength={maxLength}
          className="flex-1 text-white text-[15px]"
          style={[
            {
              minHeight: multiline ? 96 : 56,
              paddingTop: multiline ? 14 : 0,
              paddingBottom: multiline ? 14 : 0,
            },
            Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null,
          ]}
        />

        {maxLength && value.length > 0 && (
          <View className="justify-center ml-2">
            <Text className="text-[#A3A3A3] text-[12px]">
              {value.length}/{maxLength}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SelectBox({
  label,
  value,
  icon,
  options,
  onChange,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="flex-1 mb-4">
      <Text className="text-[#A3A3A3] text-[13px] font-semibold mb-2">
        {label} <Text className="text-[#65C90F]">*</Text>
      </Text>

      <TouchableOpacity
        onPress={() => setOpen((atual) => !atual)}
        className="flex-row items-center bg-[#111827] border border-[#1F2937] rounded-2xl px-4 h-[56px]"
      >
        <MaterialCommunityIcons name={icon} size={20} color="#65C90F" />
        <Text className="text-white text-[15px] ml-3 flex-1">{value}</Text>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={24}
          color="#A3A3A3"
        />
      </TouchableOpacity>

      {open && (
        <View className="bg-[#111827] border border-[#1F2937] rounded-2xl mt-2 overflow-hidden">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              className="px-4 py-3 border-b border-[#1F2937]"
            >
              <Text className="text-white">{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function OptionCard({
  active,
  icon,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 rounded-2xl border px-3 py-4 ${
        active ? "bg-[#132011] border-[#65C90F]" : "bg-[#111827] border-[#1F2937]"
      }`}
    >
      <MaterialCommunityIcons
        name={icon}
        size={26}
        color={active ? "#65C90F" : "#A3A3A3"}
      />
      <Text className="text-white font-bold mt-2 text-[14px]">{title}</Text>
      <Text className="text-[#A3A3A3] text-[12px] mt-1">{subtitle}</Text>
    </TouchableOpacity>
  );
}

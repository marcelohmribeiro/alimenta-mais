import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TERMS_ACCEPTED_KEY = "alimenta_plus_terms_accepted_v1";

const MOCK_TERMS_MARKDOWN = `# Termos de Uso do Alimenta+

**Última atualização: 30 de maio de 2026**

## 1. Sobre a Plataforma

O Alimenta+ é uma plataforma digital acadêmica, sem fins lucrativos, desenvolvida com o objetivo de conectar doadores de alimentos excedentes a pessoas e instituições que necessitam desses recursos. A plataforma atua exclusivamente como intermediadora, não produzindo, transportando, armazenando nem garantindo a qualidade sanitária dos alimentos disponibilizados.

## 2. Aceitação dos Termos

Ao criar uma conta no Alimenta+, você declara que leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize a plataforma.

## 3. Cadastro e Autenticidade

Para utilizar o Alimenta+, você deverá fornecer as seguintes informações: nome completo, CPF, endereço de e-mail e senha. Ao se cadastrar, você declara que:

- Tem capacidade legal para aceitar estes termos
- As informações fornecidas são verdadeiras, completas e atualizadas
- Não utilizará CPF de terceiros nem criará perfis falsos
- É o único responsável pela segurança e sigilo de sua senha

A plataforma poderá suspender ou excluir contas que apresentem informações falsas ou que violem estes termos.

## 4. Dados Pessoais e Privacidade

Em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018), o Alimenta+ coleta e utiliza os seguintes dados pessoais:

- **Nome e CPF:** para identificação e autenticação do usuário
- **E-mail:** para comunicação e recuperação de acesso
- **Localização:** para exibição de doações próximas ao usuário, mediante consentimento
- **Dados de doações e solicitações:** para operação da plataforma e histórico de atividades
- **Registros de acesso:** para segurança e auditoria, conforme o Marco Civil da Internet (Lei nº 12.965/2014)

Os dados coletados são utilizados exclusivamente para o funcionamento da plataforma e não são comercializados ou compartilhados com terceiros, salvo quando necessário para a operação do serviço. Você poderá solicitar a exclusão da sua conta e dos seus dados a qualquer momento pelo suporte da plataforma.

## 5. Geolocalização

A plataforma poderá solicitar acesso à localização do seu dispositivo para exibir doações disponíveis próximas a você. O uso da geolocalização é opcional e pode ser desativado nas configurações do dispositivo, podendo impactar algumas funcionalidades.

## 6. Notificações

O Alimenta+ poderá enviar notificações relacionadas às suas doações e solicitações, como confirmações de agendamento, atualizações de status e alertas relevantes. Você poderá gerenciar as preferências de notificação nas configurações do aplicativo.

## 7. Condutas Proibidas

É expressamente proibido ao usuário:

- Fornecer informações falsas ou enganosas
- Utilizar a plataforma para fins comerciais ou revenda de alimentos recebidos
- Criar múltiplas contas para obter vantagem indevida
- Praticar qualquer forma de fraude, golpe ou má-fé
- Utilizar a identidade de terceiros
- Tentar obter doações em excesso ou de forma desleal

## 8. Responsabilidades

O Alimenta+ atua apenas como intermediador digital entre doadores e receptores. A plataforma não se responsabiliza pela qualidade, origem, estado de conservação ou adequação sanitária dos alimentos disponibilizados, em conformidade com a Lei nº 14.016/2020. A responsabilidade pelas informações cadastradas e pelo cumprimento das interações é exclusivamente dos usuários envolvidos.

## 9. Suspensão e Exclusão de Conta

A plataforma poderá suspender ou excluir contas em casos de violação destes termos, uso fraudulento, má-fé comprovada ou inatividade prolongada. O usuário também poderá solicitar a exclusão voluntária de sua conta a qualquer momento.

## 10. Alterações nos Termos

Estes termos poderão ser atualizados periodicamente. Alterações relevantes serão comunicadas pelo aplicativo. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.

## 11. Legislação Aplicável

Estes termos são regidos pela legislação brasileira, em especial pela LGPD (Lei nº 13.709/2018), pelo Marco Civil da Internet (Lei nº 12.965/2014), pela Lei nº 14.016/2020 e pela Lei nº 15.224/2025.

## 12. Contato

Por se tratar de um projeto acadêmico, dúvidas ou solicitações relacionadas ao uso da plataforma devem ser direcionadas à equipe de desenvolvimento responsável pelo projeto.
`;

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "number"; text: string }
  | { type: "spacer" };

const accent = "#6FC72C";
const accentDark = "#4A9F1E";

const parseMarkdown = (markdownText: string): MarkdownBlock[] => {
  const lines = markdownText.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      blocks.push({ type: "spacer" });
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(trimmedLine);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      continue;
    }

    const bulletMatch = /^[-*+]\s+(.*)$/.exec(trimmedLine);
    if (bulletMatch) {
      blocks.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    const numberedMatch = /^\d+\.\s+(.*)$/.exec(trimmedLine);
    if (numberedMatch) {
      blocks.push({ type: "number", text: numberedMatch[1] });
      continue;
    }

    blocks.push({ type: "paragraph", text: trimmedLine });
  }

  return blocks;
};

const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.length >= 4 && part.slice(0, 2) === "**" && part.slice(-2) === "**") {
      return (
        <Text key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </Text>
      );
    }

    return <Text key={`${part}-${index}`}>{part}</Text>;
  });
};

export default function TermsScreen() {
  const [accepted, setAccepted] = useState(false);
  const [storedAccepted, setStoredAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  const markdownText = MOCK_TERMS_MARKDOWN;
  const sourceLabel = "Versão 1.0 – 30 de maio de 2026";

  const contentBlocks = useMemo(() => parseMarkdown(markdownText), [markdownText]);

  useEffect(() => {
    const loadAcceptance = async () => {
      const value = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
      if (value === "true") {
        setAccepted(true);
        setStoredAccepted(true);
      }
    };

    void loadAcceptance();
    setLoading(false);
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "true");
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#000000]">
      <LinearGradient
        colors={["#061006", "#000000", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-5 pt-2 items-center">
            <View className="w-full max-w-3xl flex-1">
              <View className="flex-row items-center justify-between mb-5">
                <Pressable onPress={() => router.back()} hitSlop={12}>
                  <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </Pressable>

                <View className="px-3 py-2 rounded-full border border-[#1F2A18] bg-[#071007]">
                  <Text className="text-[#B8F28A] text-[12px] font-medium">
                    {sourceLabel}
                  </Text>
                </View>
              </View>

              <View className="items-center mb-5">
                <LinearGradient
                  colors={["rgba(111,199,44,0.22)", "rgba(111,199,44,0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "rgba(111,199,44,0.14)",
                  }}
                >
                  <Ionicons name="document-text-outline" size={34} color={accent} />
                </LinearGradient>

                <Text
                  className="text-white text-center mt-4"
                  style={{
                    fontSize: 32,
                    fontFamily: "System",
                    fontWeight: "800",
                    letterSpacing: -0.6,
                  }}
                >
                  Termos de uso
                </Text>

                <Text className="text-[#A1A1AA] text-center mt-2 text-[14px] leading-5">
                  Um unico texto em Markdown, renderizado dentro de uma janela
                  para leitura e aceite.
                </Text>
              </View>

              <View
                className="bg-[#0A0A0A] border border-[#27272A] rounded-[28px] overflow-hidden"
                style={{ height: 620 }}
              >
                <View className="px-5 py-4 border-b border-[#1F2A18] bg-[#071007] flex-row items-center justify-between">
                  <Text className="text-white text-[15px] font-semibold">
                    Documento
                  </Text>
                  <Text className="text-[#A1A1AA] text-[12px]">
                    role para ler tudo
                  </Text>
                </View>

                {loading ? (
                  <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-[#A1A1AA]">Carregando termos mockados...</Text>
                  </View>
                ) : (
                  <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 18 }}
                    showsVerticalScrollIndicator={false}
                    style={{ minHeight: 0 }}
                  >
                    {contentBlocks.map((block: MarkdownBlock, index: number) => {
                      if (block.type === "spacer") {
                        return <View key={`spacer-${index}`} className="h-4" />;
                      }

                      if (block.type === "heading") {
                        const headingStyles: Record<1 | 2 | 3, string> = {
                          1: "text-[22px]",
                          2: "text-[18px]",
                          3: "text-[16px]",
                        };

                        return (
                          <Text
                            key={`heading-${index}`}
                            className={`text-white font-semibold ${headingStyles[block.level]}`}
                            style={{ marginTop: block.level === 1 ? 2 : 0 }}
                          >
                            {block.text}
                          </Text>
                        );
                      }

                      if (block.type === "bullet" || block.type === "number") {
                        return (
                          <View key={`${block.type}-${index}`} className="flex-row mb-2">
                            <Text className="text-[#6FC72C] text-[14px] mr-2 font-semibold">
                              {block.type === "bullet" ? "•" : `${index + 1}.`}
                            </Text>
                            <Text className="flex-1 text-[#E5E7EB] text-[14px] leading-6">
                              {renderInlineMarkdown(block.text)}
                            </Text>
                          </View>
                        );
                      }

                      return (
                        <Text
                          key={`paragraph-${index}`}
                          className="text-[#E5E7EB] text-[14px] leading-6 mb-3"
                        >
                          {renderInlineMarkdown(block.text)}
                        </Text>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <View className="mt-4 px-1">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-white text-[15px] font-medium">
                      Li e concordo com os termos
                    </Text>
                    <Text className="text-[#A1A1AA] text-[12px] mt-1 leading-4">
                      O aceite confirma que voce entendeu as regras de uso,
                      privacidade e seguranca da plataforma.
                    </Text>
                  </View>
                  <Switch
                    value={accepted}
                    onValueChange={setAccepted}
                    trackColor={{ false: "#1F2A18", true: "rgba(111,199,44,0.4)" }}
                    thumbColor={accepted ? accent : "#A1A1AA"}
                    ios_backgroundColor="#1F2A18"
                    disabled={loading || storedAccepted}
                  />
                </View>

                {storedAccepted ? (
                  <View className="flex-row items-center mb-4 px-3 py-2 rounded-2xl bg-[#071007] border border-[#1F2A18]">
                    <Ionicons name="checkmark-circle-outline" size={18} color={accent} />
                    <Text className="text-[#D9F99D] text-[13px] ml-2">
                      Termos ja aceitos neste dispositivo.
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleAccept}
                  disabled={!accepted || loading}
                  style={({ pressed }) => ({ opacity: pressed || !accepted ? 0.92 : 1 })}
                >
                  <LinearGradient
                    colors={
                      accepted ? [accent, accentDark] : ["#2B3A24", "#1F2A18"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 56,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text className="text-white text-[16px] font-semibold">
                      Aceitar e continuar
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => router.replace("/(auth)/login")}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View className="h-[52px] mt-3 rounded-2xl border border-[#27272A] items-center justify-center bg-transparent">
                    <Text className="text-white text-[15px] font-medium">
                      Voltar para o login
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
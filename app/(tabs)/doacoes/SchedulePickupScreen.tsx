import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";
import useAuth from "@/hooks/_useAuth";
import { auth, db } from "@/services";
import { FirestoreServiceError } from "@/services/_firestore";
import type {
  AppNotificationDocument,
  DonationRequestDocument,
  DonationRequestDocumentWithId,
  PickupScheduleDocument,
  UserProfile,
} from "@/types";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKGROUND = "#0B0F0C";
const CARD = "#111827";
const CARD_ALT = "#0F172A";
const STROKE = "rgba(255,255,255,0.08)";
const GREEN = "#22C55E";
const GREEN_DEEP = "#0F2A18";
const TEXT_MUTED = "#C9D1D9";
const TEXT_SOFT = "#94A3B8";
const INPUT = "#0B1220";
const FALLBACK_IMAGE = require("@/assets/images/pao.jpg");
const OBSERVATION_LIMIT = 150;
const SLOT_STEP_MINUTES = 30;

type SearchParams = {
  donationId?: string | string[];
  requestId?: string | string[];
};

type FirebaseTimestampLike = {
  toDate: () => Date;
};

type RawDonationDocument = {
  nomeAlimento?: string;
  tipoAlimento?: string;
  categoria?: string;
  peso?: string;
  quantidade?: string;
  fotoUrl?: string;
  fotos?: { secureUrl?: string }[];
  descricao?: string;
  validade?: unknown;
  enderecoRetirada?: string;
  localizacao?: string;
  donorId?: string;
  status?: string;
  dataInicioDisponibilidade?: unknown;
  dataFimDisponibilidade?: unknown;
  dataRetirada?: unknown;
  horaInicioDisponibilidade?: string;
  horaFimDisponibilidade?: string;
  horarioInicio?: string;
  horarioFim?: string;
};

type NormalizedDonation = {
  id: string;
  nomeAlimento: string;
  categoria: string;
  peso: string;
  fotoUrl: string | null;
  descricao: string;
  validade: string;
  enderecoRetirada: string;
  donorId: string;
  donorLabel: string;
  status: string;
  dataInicioDisponibilidade: string;
  dataFimDisponibilidade: string;
  horaInicioDisponibilidade: string;
  horaFimDisponibilidade: string;
};

type PickerOption = {
  label: string;
  value: string;
  helper?: string;
};

type ValidationResult = {
  valid: boolean;
  message?: string;
};

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const isTimestampLike = (value: unknown): value is FirebaseTimestampLike =>
  typeof value === "object" &&
  value !== null &&
  "toDate" in value &&
  typeof (value as FirebaseTimestampLike).toDate === "function";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const pad = (value: number) => String(value).padStart(2, "0");

const dateToKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateValue = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return startOfDay(value);
  }

  if (isTimestampLike(value)) {
    return startOfDay(value.toDate());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/").map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfDay(parsed);
    }
  }

  return null;
};

const parseTimeValue = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

const minutesToTimeLabel = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

const formatDateLabel = (value: string) => {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return value;
  }

  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const buildDonorLabel = (
  donorId: string,
  donorProfile?: Partial<UserProfile> | null,
) => {
  if (donorProfile?.nome?.trim()) {
    return donorProfile.nome.trim();
  }

  if (donorProfile?.email?.trim()) {
    return donorProfile.email.trim();
  }

  if (donorId) {
    return `Doador ${donorId.slice(0, 6)}`;
  }

  return "Doador";
};

const normalizeDonation = (
  donationId: string,
  rawDonation: RawDonationDocument,
  donorLabel: string,
): NormalizedDonation | null => {
  const nomeAlimento = String(
    rawDonation.nomeAlimento ?? rawDonation.tipoAlimento ?? "",
  ).trim();
  const categoria = String(rawDonation.categoria ?? "Categoria nao informada").trim();
  const peso = String(rawDonation.peso ?? rawDonation.quantidade ?? "").trim();
  const descricao = String(rawDonation.descricao ?? "Sem descricao informada.").trim();
  const enderecoRetirada = String(
    rawDonation.enderecoRetirada ?? rawDonation.localizacao ?? "",
  ).trim();
  const donorId = String(rawDonation.donorId ?? "").trim();
  const fotoUrl =
    typeof rawDonation.fotoUrl === "string" && rawDonation.fotoUrl.trim()
      ? rawDonation.fotoUrl.trim()
      : rawDonation.fotos?.[0]?.secureUrl?.trim() || null;
  const validadeDate = parseDateValue(rawDonation.validade);
  const dataInicio =
    parseDateValue(
      rawDonation.dataInicioDisponibilidade ?? rawDonation.dataRetirada,
    ) ?? null;
  const dataFim =
    parseDateValue(rawDonation.dataFimDisponibilidade ?? rawDonation.dataRetirada) ??
    null;
  const horaInicio = String(
    rawDonation.horaInicioDisponibilidade ?? rawDonation.horarioInicio ?? "",
  ).trim();
  const horaFim = String(
    rawDonation.horaFimDisponibilidade ?? rawDonation.horarioFim ?? "",
  ).trim();

  if (
    !nomeAlimento ||
    !peso ||
    !enderecoRetirada ||
    !donorId ||
    !validadeDate ||
    !dataInicio ||
    !dataFim ||
    !horaInicio ||
    !horaFim
  ) {
    return null;
  }

  return {
    id: donationId,
    nomeAlimento,
    categoria: categoria || "Categoria nao informada",
    peso,
    fotoUrl,
    descricao: descricao || "Sem descricao informada.",
    validade: dateToKey(validadeDate),
    enderecoRetirada,
    donorId,
    donorLabel,
    status: String(rawDonation.status ?? "").trim(),
    dataInicioDisponibilidade: dateToKey(dataInicio),
    dataFimDisponibilidade: dateToKey(dataFim),
    horaInicioDisponibilidade: horaInicio,
    horaFimDisponibilidade: horaFim,
  };
};

const buildRequest = (
  requestId: string,
  rawRequest: Partial<DonationRequestDocument>,
): DonationRequestDocumentWithId => ({
  id: requestId,
  donationId: String(rawRequest.donationId ?? "").trim(),
  donorId: String(rawRequest.donorId ?? "").trim(),
  requesterId: String(rawRequest.requesterId ?? "").trim(),
  status: (String(rawRequest.status ?? "pendente").trim().toLowerCase() ||
    "pendente") as DonationRequestDocument["status"],
  criadoEm: rawRequest.criadoEm,
  atualizadoEm: rawRequest.atualizadoEm,
});

const buildDateOptions = (donation: NormalizedDonation | null): PickerOption[] => {
  if (!donation) {
    return [];
  }

  const availabilityStart = parseDateValue(donation.dataInicioDisponibilidade);
  const availabilityEnd = parseDateValue(donation.dataFimDisponibilidade);

  if (!availabilityStart || !availabilityEnd) {
    return [];
  }

  const firstDate = new Date(
    Math.max(startOfDay(new Date()).getTime(), availabilityStart.getTime()),
  );

  if (firstDate.getTime() > availabilityEnd.getTime()) {
    return [];
  }

  const options: PickerOption[] = [];
  const cursor = new Date(firstDate);

  while (cursor.getTime() <= availabilityEnd.getTime()) {
    options.push({
      label: formatDateLabel(dateToKey(cursor)),
      value: dateToKey(cursor),
      helper:
        dateToKey(cursor) === dateToKey(new Date()) ? "Hoje" : undefined,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
};

const buildTimeOptions = (
  donation: NormalizedDonation | null,
  selectedDate: string,
): PickerOption[] => {
  if (!donation || !selectedDate) {
    return [];
  }

  const startMinutes = parseTimeValue(donation.horaInicioDisponibilidade);
  const endMinutes = parseTimeValue(donation.horaFimDisponibilidade);
  const selected = parseDateValue(selectedDate);

  if (startMinutes === null || endMinutes === null || !selected) {
    return [];
  }

  const now = new Date();
  const isToday = dateToKey(selected) === dateToKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const minimumMinutes = isToday ? Math.max(startMinutes, currentMinutes) : startMinutes;

  if (minimumMinutes > endMinutes) {
    return [];
  }

  const options: PickerOption[] = [];
  let cursor = minimumMinutes;

  if (cursor > startMinutes && cursor % SLOT_STEP_MINUTES !== 0) {
    cursor += SLOT_STEP_MINUTES - (cursor % SLOT_STEP_MINUTES);
  }

  if (cursor < startMinutes) {
    cursor = startMinutes;
  }

  while (cursor <= endMinutes) {
    options.push({
      label: minutesToTimeLabel(cursor),
      value: minutesToTimeLabel(cursor),
    });
    cursor += SLOT_STEP_MINUTES;
  }

  if (options.length === 0 && minimumMinutes <= endMinutes) {
    options.push({
      label: minutesToTimeLabel(minimumMinutes),
      value: minutesToTimeLabel(minimumMinutes),
    });
  }

  return options;
};

const SchedulePickupScreen = () => {
  const { initializing } = useAuth();
  const { donationId: rawDonationId, requestId: rawRequestId } =
    useLocalSearchParams<SearchParams>();
  const donationId = getSingleParam(rawDonationId);
  const requestId = getSingleParam(rawRequestId);

  const [donation, setDonation] = useState<NormalizedDonation | null>(null);
  const [request, setRequest] = useState<DonationRequestDocumentWithId | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successNotifications, setSuccessNotifications] = useState<string[]>([]);

  const currentUser = auth?.currentUser ?? null;
  const isExpiredDonation = useMemo(() => {
    if (!donation) {
      return false;
    }

    const expiryDate = parseDateValue(donation.validade);

    if (!expiryDate) {
      return true;
    }

    return expiryDate.getTime() < startOfDay(new Date()).getTime();
  }, [donation]);

  const dateOptions = useMemo(() => buildDateOptions(donation), [donation]);
  const timeOptions = useMemo(
    () => buildTimeOptions(donation, selectedDate),
    [donation, selectedDate],
  );

  const validateDate = (value = selectedDate): ValidationResult => {
    if (!donation) {
      return { valid: false, message: "Carregue a doacao antes de escolher a data." };
    }

    if (isExpiredDonation) {
      return {
        valid: false,
        message: "Esta doacao nao esta mais disponivel para retirada.",
      };
    }

    const selected = parseDateValue(value);
    const startDate = parseDateValue(donation.dataInicioDisponibilidade);
    const endDate = parseDateValue(donation.dataFimDisponibilidade);
    const today = startOfDay(new Date());

    if (!selected || !startDate || !endDate) {
      return {
        valid: false,
        message:
          "Selecione uma data dentro do periodo de disponibilidade da doacao.",
      };
    }

    if (
      selected.getTime() < today.getTime() ||
      selected.getTime() < startDate.getTime() ||
      selected.getTime() > endDate.getTime()
    ) {
      return {
        valid: false,
        message:
          "Selecione uma data dentro do periodo de disponibilidade da doacao.",
      };
    }

    return { valid: true };
  };

  const validateTime = (
    value = selectedTime,
    dateValue = selectedDate,
  ): ValidationResult => {
    if (!donation) {
      return { valid: false, message: "Carregue a doacao antes de escolher o horario." };
    }

    if (isExpiredDonation) {
      return {
        valid: false,
        message: "Esta doacao nao esta mais disponivel para retirada.",
      };
    }

    const selected = parseDateValue(dateValue);
    const selectedMinutes = parseTimeValue(value);
    const startMinutes = parseTimeValue(donation.horaInicioDisponibilidade);
    const endMinutes = parseTimeValue(donation.horaFimDisponibilidade);

    if (!selected || selectedMinutes === null || startMinutes === null || endMinutes === null) {
      return {
        valid: false,
        message:
          "Selecione um horario dentro do intervalo informado pelo doador.",
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = dateToKey(selected) === dateToKey(now);

    if (
      selectedMinutes < startMinutes ||
      selectedMinutes > endMinutes ||
      (isToday && selectedMinutes < currentMinutes)
    ) {
      return {
        valid: false,
        message:
          "Selecione um horario dentro do intervalo informado pelo doador.",
      };
    }

    return { valid: true };
  };

  const validatePickup = (): ValidationResult => {
    if (!donationId || !requestId) {
      return { valid: false, message: "DonationId e requestId sao obrigatorios." };
    }

    if (!currentUser?.uid) {
      return {
        valid: false,
        message: "Voce precisa estar autenticado para agendar a retirada.",
      };
    }

    if (!donation || !request) {
      return {
        valid: false,
        message: "Nao foi possivel carregar os dados da doacao e da solicitacao.",
      };
    }

    if (request.requesterId !== currentUser.uid) {
      return {
        valid: false,
        message: "Apenas o solicitante desta doacao pode criar o agendamento.",
      };
    }

    if (request.status !== "aceita") {
      return {
        valid: false,
        message: "A solicitacao precisa estar aceita para permitir o agendamento.",
      };
    }

    if (isExpiredDonation) {
      return {
        valid: false,
        message: "Esta doacao nao esta mais disponivel para retirada.",
      };
    }

    const dateValidation = validateDate();
    if (!dateValidation.valid) {
      return dateValidation;
    }

    const timeValidation = validateTime();
    if (!timeValidation.valid) {
      return timeValidation;
    }

    return { valid: true };
  };

  const loadData = useCallback(async () => {
    if (initializing) {
      return;
    }

    if (!donationId || !requestId) {
      setError("DonationId e requestId sao obrigatorios para abrir esta tela.");
      setLoading(false);
      return;
    }

    if (!currentUser?.uid) {
      setError("Voce precisa estar logado para agendar a retirada.");
      setLoading(false);
      return;
    }

    if (!db) {
      setError("Firebase nao esta configurado para carregar o agendamento.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const donationRef = doc(db, "donations", donationId);
      const requestRef = doc(db, "requests", requestId);
      const [donationSnap, requestSnap] = await Promise.all([
        getDoc(donationRef),
        getDoc(requestRef),
      ]);

      if (!donationSnap.exists()) {
        throw new FirestoreServiceError("Doacao nao encontrada.");
      }

      if (!requestSnap.exists()) {
        throw new FirestoreServiceError("Solicitacao nao encontrada.");
      }

      const rawRequest = buildRequest(
        requestSnap.id,
        requestSnap.data() as Partial<DonationRequestDocument>,
      );

      if (!rawRequest.donationId) {
        throw new FirestoreServiceError("A solicitacao nao possui donationId valido.");
      }

      if (rawRequest.donationId !== donationId) {
        throw new FirestoreServiceError(
          "A solicitacao informada nao corresponde a esta doacao.",
        );
      }

      if (rawRequest.requesterId !== currentUser.uid) {
        throw new FirestoreServiceError(
          "Apenas o solicitante desta doacao pode agendar a retirada.",
        );
      }

      if (rawRequest.status !== "aceita") {
        throw new FirestoreServiceError(
          "Esta solicitacao ainda nao esta aceita para agendamento.",
        );
      }

      const rawDonation = donationSnap.data() as RawDonationDocument;
      const donorId = String(rawDonation.donorId ?? rawRequest.donorId ?? "").trim();

      let donorProfile: Partial<UserProfile> | null = null;
      if (donorId) {
        const donorSnap = await getDoc(doc(db, "users", donorId));
        if (donorSnap.exists()) {
          donorProfile = donorSnap.data() as Partial<UserProfile>;
        }
      }

      const normalizedDonation = normalizeDonation(
        donationSnap.id,
        {
          ...rawDonation,
          donorId,
        },
        buildDonorLabel(donorId, donorProfile),
      );

      if (!normalizedDonation) {
        throw new FirestoreServiceError(
          "Os dados da doacao estao incompletos para o agendamento.",
        );
      }

      const expiryDate = parseDateValue(normalizedDonation.validade);
      if (!expiryDate || expiryDate.getTime() < startOfDay(new Date()).getTime()) {
        throw new FirestoreServiceError(
          "Esta doacao nao esta mais disponivel para retirada.",
        );
      }

      setDonation(normalizedDonation);
      setRequest(rawRequest);
      setSelectedDate("");
      setSelectedTime("");
      setObservation("");
      setSubmitAttempted(false);
    } catch (loadError) {
      setDonation(null);
      setRequest(null);
      setError(
        loadError instanceof FirestoreServiceError
          ? loadError.message
          : "Nao foi possivel carregar os dados para o agendamento.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, donationId, initializing, requestId]);

  const createNotifications = async (scheduleId: string) => {
    const firestore = db;

    if (!firestore || !donation || !request) {
      return;
    }

    const notifications: AppNotificationDocument[] = [
      {
        userId: request.requesterId,
        tipo: "pickup_schedule_requester",
        titulo: "Retirada agendada",
        mensagem: "Sua retirada foi agendada com sucesso.",
        referenciaId: scheduleId,
        lida: false,
        criadoEm: serverTimestamp(),
      },
      {
        userId: request.donorId || donation.donorId,
        tipo: "pickup_schedule_donor",
        titulo: "Nova retirada agendada",
        mensagem: "Uma retirada foi agendada para sua doacao.",
        referenciaId: scheduleId,
        lida: false,
        criadoEm: serverTimestamp(),
      },
    ];

    await Promise.all(
      notifications.map((notification) =>
        addDoc(collection(firestore, "notifications"), notification),
      ),
    );

    // Futuramente: integrar Firebase Cloud Messaging para enviar push notifications.
    // Futuramente: persistir tokens por usuario e acionar notificacoes em background.
    setSuccessNotifications(notifications.map((notification) => notification.mensagem));
  };

  const handleOpenConfirmModal = () => {
    setSubmitAttempted(true);
    const validation = validatePickup();

    if (!validation.valid) {
      return;
    }

    setConfirmModalVisible(true);
  };

  const handleConfirmPickup = async () => {
    const validation = validatePickup();
    const firestore = db;

    if (
      !validation.valid ||
      !firestore ||
      !currentUser?.uid ||
      !donation ||
      !request
    ) {
      setSubmitAttempted(true);
      return;
    }

    setSaving(true);

    try {
      const pickupPayload: PickupScheduleDocument = {
        donationId: donation.id,
        requestId: request.id,
        donorId: request.donorId || donation.donorId,
        requesterId: currentUser.uid,
        dataRetirada: selectedDate,
        horarioRetirada: selectedTime,
        observacao: observation.trim(),
        status: "agendada",
        criadoEm: serverTimestamp(),
      };

      const scheduleRef = await addDoc(
        collection(firestore, "pickupSchedules"),
        pickupPayload,
      );

      await updateDoc(doc(firestore, "requests", request.id), {
        status: "retirada_agendada",
        atualizadoEm: serverTimestamp(),
      });

      await createNotifications(scheduleRef.id);

      setRequest((current) =>
        current
          ? {
              ...current,
              status: "retirada_agendada",
            }
          : current,
      );
      setConfirmModalVisible(false);
      setSuccessModalVisible(true);
    } catch (saveError) {
      setError(
        saveError instanceof FirestoreServiceError
          ? saveError.message
          : "Nao foi possivel salvar o agendamento. Tente novamente.",
      );
      setConfirmModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedDate && !dateOptions.some((option) => option.value === selectedDate)) {
      setSelectedDate("");
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    if (selectedTime && !timeOptions.some((option) => option.value === selectedTime)) {
      setSelectedTime("");
    }
  }, [timeOptions, selectedTime]);

  const dateValidation = validateDate();
  const timeValidation = validateTime();
  const pickupValidation = validatePickup();

  const isConfirmDisabled =
    loading ||
    saving ||
    !donationId ||
    !requestId ||
    !currentUser?.uid ||
    !pickupValidation.valid;

  if (loading || initializing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: BACKGROUND }}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["rgba(34,197,94,0.14)", "rgba(11,15,12,0)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280 }}
        />
        <View
          className="items-center rounded-[28px] border px-8 py-8"
          style={{ backgroundColor: CARD, borderColor: STROKE }}
        >
          <ActivityIndicator size="large" color={GREEN} />
          <Text className="mt-5 text-xl font-semibold text-white">
            Carregando agendamento
          </Text>
          <Text className="mt-2 text-center" style={{ color: TEXT_SOFT }}>
            Estamos buscando a doacao, a solicitacao e a disponibilidade do doador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !donation || !request) {
    return (
      <SafeAreaView className="flex-1 justify-center px-5" style={{ backgroundColor: BACKGROUND }}>
        <StatusBar style="light" />
        <View
          className="rounded-[30px] border p-6"
          style={{ backgroundColor: CARD, borderColor: STROKE }}
        >
          <View
            className="mb-5 h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#F87171" />
          </View>
          <Text className="text-[26px] font-semibold text-white">
            Agendamento indisponivel
          </Text>
          <Text className="mt-3 leading-6" style={{ color: TEXT_MUTED }}>
            {error ?? "Nao foi possivel carregar os dados desta doacao agora."}
          </Text>

          <Pressable
            onPress={loadData}
            className="mt-6 overflow-hidden rounded-[20px]"
          >
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 items-center justify-center rounded-[20px]"
            >
              <Text className="text-base font-semibold text-[#06110A]">
                Tentar novamente
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-3 h-14 items-center justify-center rounded-[20px]"
            style={{ backgroundColor: INPUT }}
          >
            <Text className="text-base font-medium text-white">Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BACKGROUND }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["rgba(34,197,94,0.08)", "rgba(11,15,12,0.98)", "rgba(11,15,12,1)"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        className="absolute -left-20 top-0 h-[240px] w-[240px] rounded-full"
        style={{ backgroundColor: "rgba(34,197,94,0.05)" }}
      />
      <View
        className="absolute right-[-70px] top-[280px] h-[180px] w-[180px] rounded-full"
        style={{ backgroundColor: "rgba(16,185,129,0.04)" }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 182 }}
      >
        <View className="px-5 pb-8 pt-3">
          <View className="mb-7 flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              <Pressable
                onPress={() => router.back()}
                className="mb-5 h-11 w-11 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: "rgba(17,24,39,0.88)",
                  borderColor: STROKE,
                }}
              >
                <Feather name="chevron-left" size={23} color="#FFFFFF" />
              </Pressable>

              <Text className="text-[30px] font-semibold leading-[36px] tracking-[-0.4px] text-white">
                Agendar retirada
              </Text>
              <Text className="mt-2 max-w-[310px] leading-6" style={{ color: TEXT_SOFT }}>
                Escolha uma data e horario para retirar sua doacao.
              </Text>
            </View>

            <View
              className="mt-2 h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: GREEN_DEEP }}
            >
              <MaterialCommunityIcons name="calendar-clock-outline" size={23} color={GREEN} />
            </View>
          </View>

          {isExpiredDonation ? (
            <FeedbackBanner
              icon="clock-alert-outline"
              tone="negative"
              title="Doacao indisponivel"
              message="Esta doacao nao esta mais disponivel para retirada."
            />
          ) : null}

          <SectionCard title="Doacao selecionada" subtitle="Confira os dados confirmados antes de agendar.">
            <View className="overflow-hidden rounded-[24px] border" style={{ borderColor: STROKE }}>
              <Image
                source={donation.fotoUrl ? { uri: donation.fotoUrl } : FALLBACK_IMAGE}
                style={{ width: "100%", height: 220 }}
                contentFit="cover"
                transition={180}
              />
              <LinearGradient
                colors={["rgba(11,15,12,0)", "rgba(11,15,12,0.92)"]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 120,
                }}
              />
            </View>

            <View className="mt-5">
              <View className="mb-3 flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-[28px] font-semibold leading-[32px] text-white">
                    {donation.nomeAlimento}
                  </Text>
                  <Text className="mt-2 leading-6" style={{ color: TEXT_MUTED }}>
                    {donation.descricao}
                  </Text>
                </View>
                <StatusBadge text="Solicitacao aceita" />
              </View>

              <View className="mb-5 flex-row flex-wrap">
                <MetricPill icon="food-variant" label="Categoria" value={donation.categoria} />
                <MetricPill icon="scale-bathroom" label="Peso" value={donation.peso} />
                <MetricPill icon="calendar-check-outline" label="Validade" value={formatDateLabel(donation.validade)} />
              </View>

              <View
                className="rounded-[22px] border p-4"
                style={{ backgroundColor: CARD_ALT, borderColor: STROKE }}
              >
                <InfoRow
                  icon="account-circle-outline"
                  title="Doador"
                  value={donation.donorLabel}
                />
                <Divider />
                <InfoRow
                  icon="map-marker-outline"
                  title="Endereco de retirada"
                  value={donation.enderecoRetirada}
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Disponibilidade do doador" subtitle="A retirada precisa respeitar a janela informada pelo doador.">
            <View
              className="rounded-[22px] border p-4"
              style={{ backgroundColor: CARD_ALT, borderColor: STROKE }}
            >
              <InfoRow
                icon="calendar-range"
                title="Periodo disponivel"
                value={`Disponivel de ${formatDateLabel(
                  donation.dataInicioDisponibilidade,
                )} ate ${formatDateLabel(donation.dataFimDisponibilidade)}`}
              />
              <Divider />
              <InfoRow
                icon="clock-outline"
                title="Horario disponivel"
                value={`Das ${donation.horaInicioDisponibilidade} as ${donation.horaFimDisponibilidade}`}
              />
            </View>

            <View
              className="mt-4 rounded-[20px] border px-4 py-4"
              style={{
                backgroundColor: "rgba(34,197,94,0.08)",
                borderColor: "rgba(34,197,94,0.16)",
              }}
            >
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="shield-check-outline" size={20} color={GREEN} />
                <Text className="ml-3 flex-1 leading-6" style={{ color: "#CFFCDC" }}>
                  Escolha uma data e horario dentro do periodo informado pelo doador.
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Data e horario da retirada" subtitle="Selecione somente opcoes validas para esta doacao.">
            <PickerField
              label="Data da retirada"
              value={selectedDate ? formatDateLabel(selectedDate) : ""}
              placeholder="Selecionar data"
              icon="calendar-month-outline"
              onPress={() => setDatePickerVisible(true)}
            />
            {(submitAttempted || selectedDate) && !dateValidation.valid ? (
              <ValidationText message={dateValidation.message} />
            ) : null}

            <View className="h-4" />

            <PickerField
              label="Horario da retirada"
              value={selectedTime}
              placeholder="Selecionar horario"
              icon="clock-outline"
              onPress={() => setTimePickerVisible(true)}
              disabled={!selectedDate || !dateValidation.valid}
            />
            {(submitAttempted || selectedTime) && !timeValidation.valid ? (
              <ValidationText message={timeValidation.message} />
            ) : null}
          </SectionCard>

          <SectionCard title="Observacao opcional" subtitle="Adicione um contexto util para a retirada, se precisar.">
            <View
              className="rounded-[22px] border px-4 py-4"
              style={{ backgroundColor: INPUT, borderColor: STROKE }}
            >
              <TextInput
                value={observation}
                onChangeText={(text) => setObservation(text.slice(0, OBSERVATION_LIMIT))}
                placeholder="Ex.: Chego na portaria as 15h. Pode deixar com o porteiro?"
                placeholderTextColor="#64748B"
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 108,
                  color: "#FFFFFF",
                  fontSize: 15,
                  lineHeight: 22,
                }}
              />
              <View className="mt-4 flex-row items-center justify-between">
                <Text style={{ color: TEXT_SOFT }}>
                  Campo opcional para orientar o doador.
                </Text>
                <Text style={{ color: TEXT_SOFT }}>
                  {observation.length}/{OBSERVATION_LIMIT}
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Aviso de seguranca">
            <View
              className="rounded-[22px] border px-4 py-4"
              style={{
                backgroundColor: "rgba(245,158,11,0.07)",
                borderColor: "rgba(245,158,11,0.16)",
              }}
            >
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="alert-outline" size={20} color="#FBBF24" />
                <Text className="ml-3 flex-1 leading-6" style={{ color: "#F8E7B0" }}>
                  O Alimenta+ atua apenas como facilitador da conexao entre usuarios e
                  nao se responsabiliza pelas condicoes do alimento. Verifique o
                  alimento antes do consumo.
                </Text>
              </View>
            </View>
          </SectionCard>

          {successNotifications.length > 0 ? (
            <SectionCard title="Notificacoes criadas" subtitle="Resumo local do que foi registrado no Firestore.">
              {successNotifications.map((message) => (
                <View
                  key={message}
                  className="mb-3 rounded-[18px] border px-4 py-3"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.08)",
                    borderColor: "rgba(34,197,94,0.18)",
                  }}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="bell-ring-outline"
                      size={18}
                      color={GREEN}
                    />
                    <Text className="ml-3 flex-1" style={{ color: "#D8FFE4" }}>
                      {message}
                    </Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4"
        style={{
          backgroundColor: "rgba(11,15,12,0.95)",
          borderTopWidth: 1,
          borderTopColor: STROKE,
        }}
      >
        {!pickupValidation.valid && submitAttempted ? (
          <Text className="mb-3 text-sm" style={{ color: "#FCA5A5" }}>
            {pickupValidation.message}
          </Text>
        ) : (
          <Text className="mb-3 text-sm" style={{ color: TEXT_SOFT }}>
            Confirme a retirada somente apos revisar data, horario e endereco.
          </Text>
        )}

        <Pressable
          disabled={isConfirmDisabled}
          onPress={handleOpenConfirmModal}
          className="overflow-hidden rounded-[22px]"
        >
          <LinearGradient
            colors={isConfirmDisabled ? ["#365946", "#274335"] : ["#22C55E", "#16A34A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-[62px] items-center justify-center rounded-[22px]"
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={22}
                color={isConfirmDisabled ? "#B6C8BC" : "#04110A"}
              />
              <Text
                className="ml-3 text-[18px] font-semibold"
                style={{ color: isConfirmDisabled ? "#D1D5DB" : "#04110A" }}
              >
                Confirmar retirada
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <SelectorModal
        title="Escolha a data"
        subtitle="Selecione um dia disponivel para retirar a doacao."
        isOpen={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        options={dateOptions}
        selectedValue={selectedDate}
        emptyMessage="Nao ha datas disponiveis dentro da janela cadastrada."
        onSelect={(value) => {
          setSelectedDate(value);
          setSelectedTime("");
          setDatePickerVisible(false);
        }}
      />

      <SelectorModal
        title="Escolha o horario"
        subtitle="Mostramos apenas horarios validos para o dia selecionado."
        isOpen={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        options={timeOptions}
        selectedValue={selectedTime}
        emptyMessage="Nao ha horarios validos para a data escolhida."
        onSelect={(value) => {
          setSelectedTime(value);
          setTimePickerVisible(false);
        }}
      />

      <Modal isOpen={confirmModalVisible}>
        <ModalBackdrop />
        <ModalContent
          className="mx-5 rounded-[28px] border p-0"
          style={{ backgroundColor: CARD, borderColor: STROKE }}
        >
          <ModalHeader className="items-center px-6 pb-0 pt-6">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: GREEN_DEEP }}
            >
              <MaterialCommunityIcons name="calendar-check-outline" size={26} color={GREEN} />
            </View>
          </ModalHeader>
          <ModalBody className="px-6 pb-0 pt-4">
            <Text className="text-center text-[24px] font-semibold text-white">
              Confirmar retirada
            </Text>
            <Text className="mt-2 text-center leading-6" style={{ color: TEXT_SOFT }}>
              Revise os dados abaixo antes de salvar o agendamento no Firebase.
            </Text>

            <View
              className="mt-5 rounded-[24px] border p-4"
              style={{ backgroundColor: CARD_ALT, borderColor: STROKE }}
            >
              <InfoRow
                icon="food-outline"
                title="Alimento"
                value={donation.nomeAlimento}
              />
              <Divider />
              <InfoRow
                icon="calendar-outline"
                title="Data"
                value={selectedDate ? formatDateLabel(selectedDate) : "-"}
              />
              <Divider />
              <InfoRow
                icon="clock-outline"
                title="Horario"
                value={selectedTime || "-"}
              />
              <Divider />
              <InfoRow
                icon="map-marker-outline"
                title="Endereco"
                value={donation.enderecoRetirada}
              />
            </View>
          </ModalBody>
          <ModalFooter className="px-6 pb-6 pt-5">
            <Pressable
              onPress={() => !saving && setConfirmModalVisible(false)}
              className="mr-3 h-12 flex-1 items-center justify-center rounded-[18px]"
              style={{ backgroundColor: INPUT }}
            >
              <Text className="text-[15px] font-medium text-white">Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmPickup}
              disabled={saving}
              className="flex-1 overflow-hidden rounded-[18px]"
            >
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-12 items-center justify-center rounded-[18px]"
              >
                {saving ? (
                  <ActivityIndicator color="#04110A" size="small" />
                ) : (
                  <Text className="text-[15px] font-semibold text-[#04110A]">
                    Confirmar
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={successModalVisible}>
        <ModalBackdrop />
        <ModalContent
          className="mx-5 rounded-[28px] border p-0"
          style={{ backgroundColor: CARD, borderColor: STROKE }}
        >
          <ModalHeader className="items-center px-6 pb-0 pt-6">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: GREEN_DEEP }}
            >
              <MaterialCommunityIcons name="check-bold" size={28} color={GREEN} />
            </View>
          </ModalHeader>
          <ModalBody className="px-6 pb-0 pt-4">
            <Text className="text-center text-[24px] font-semibold text-white">
              Retirada agendada com sucesso!
            </Text>
            <Text className="mt-2 text-center leading-6" style={{ color: TEXT_SOFT }}>
              O doador e o solicitante foram notificados.
            </Text>

            <View
              className="mt-5 rounded-[24px] border p-4"
              style={{
                backgroundColor: "rgba(34,197,94,0.08)",
                borderColor: "rgba(34,197,94,0.18)",
              }}
            >
              <View className="mb-3 flex-row items-center">
                <MaterialCommunityIcons
                  name="bell-check-outline"
                  size={18}
                  color={GREEN}
                />
                <Text className="ml-3 flex-1" style={{ color: "#D8FFE4" }}>
                  Sua retirada foi agendada com sucesso.
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={18}
                  color={GREEN}
                />
                <Text className="ml-3 flex-1" style={{ color: "#D8FFE4" }}>
                  Uma retirada foi agendada para sua doacao.
                </Text>
              </View>
            </View>
          </ModalBody>
          <ModalFooter className="px-6 pb-6 pt-5">
            <Pressable
              onPress={() => {
                setSuccessModalVisible(false);
                router.back();
              }}
              className="overflow-hidden rounded-[18px] flex-1"
            >
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-12 items-center justify-center rounded-[18px]"
              >
                <Text className="text-[15px] font-semibold text-[#04110A]">
                  Fechar
                </Text>
              </LinearGradient>
            </Pressable>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
};

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View
      className="mb-4 rounded-[28px] border p-4"
      style={{ backgroundColor: CARD, borderColor: STROKE }}
    >
      <Text className="text-[22px] font-semibold text-white">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 mb-4 leading-6" style={{ color: TEXT_SOFT }}>
          {subtitle}
        </Text>
      ) : (
        <View className="h-4" />
      )}
      {children}
    </View>
  );
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      className="mb-3 mr-3 min-w-[104px] rounded-[20px] border px-4 py-3"
      style={{ backgroundColor: CARD_ALT, borderColor: STROKE }}
    >
      <MaterialCommunityIcons name={icon} size={18} color={GREEN} />
      <Text className="mt-2 text-xs" style={{ color: TEXT_SOFT }}>
        {label}
      </Text>
      <Text className="mt-1 text-[15px] font-semibold text-white">{value}</Text>
    </View>
  );
}

function StatusBadge({ text }: { text: string }) {
  return (
    <View
      className="rounded-full px-3 py-2"
      style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
    >
      <View className="flex-row items-center">
        <MaterialCommunityIcons
          name="check-decagram-outline"
          size={16}
          color={GREEN}
        />
        <Text className="ml-2 text-[13px] font-medium" style={{ color: "#CFFCDC" }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start">
      <View
        className="mr-4 h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(34,197,94,0.10)" }}
      >
        <MaterialCommunityIcons name={icon} size={21} color={GREEN} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-medium" style={{ color: TEXT_SOFT }}>
          {title}
        </Text>
        <Text className="mt-1 text-[15px] leading-6 text-white">{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="my-4 h-px" style={{ backgroundColor: STROKE }} />;
}

function PickerField({
  label,
  value,
  placeholder,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View>
      <Text className="mb-2 text-[13px] font-semibold" style={{ color: TEXT_MUTED }}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="flex-row items-center rounded-[22px] border px-4 py-4"
        style={{
          backgroundColor: disabled ? "#0B101B" : INPUT,
          borderColor: STROKE,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={GREEN} />
        <Text
          className="ml-3 flex-1 text-[15px]"
          style={{ color: value ? "#FFFFFF" : TEXT_SOFT }}
        >
          {value || placeholder}
        </Text>
        <Feather name="chevron-right" size={20} color="#94A3B8" />
      </Pressable>
    </View>
  );
}

function ValidationText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <Text className="mt-2 text-[13px]" style={{ color: "#FCA5A5" }}>
      {message}
    </Text>
  );
}

function FeedbackBanner({
  icon,
  title,
  message,
  tone,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  tone: "negative" | "positive";
}) {
  return (
    <View
      className="mb-4 rounded-[22px] border px-4 py-4"
      style={{
        backgroundColor:
          tone === "negative" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
        borderColor:
          tone === "negative" ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
      }}
    >
      <View className="flex-row items-start">
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={tone === "negative" ? "#F87171" : GREEN}
        />
        <View className="ml-3 flex-1">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: tone === "negative" ? "#FECACA" : "#D8FFE4" }}
          >
            {title}
          </Text>
          <Text className="mt-1 leading-6" style={{ color: tone === "negative" ? "#FECACA" : "#D8FFE4" }}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SelectorModal({
  title,
  subtitle,
  isOpen,
  onClose,
  options,
  selectedValue,
  emptyMessage,
  onSelect,
}: {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onClose: () => void;
  options: PickerOption[];
  selectedValue: string;
  emptyMessage: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal isOpen={isOpen}>
      <ModalBackdrop />
      <ModalContent
        className="mx-5 max-h-[80%] rounded-[28px] border p-0"
        style={{ backgroundColor: CARD, borderColor: STROKE }}
      >
        <ModalHeader className="px-6 pb-0 pt-6">
          <View className="flex-1">
            <Text className="text-[22px] font-semibold text-white">{title}</Text>
            <Text className="mt-1 leading-6" style={{ color: TEXT_SOFT }}>
              {subtitle}
            </Text>
          </View>
        </ModalHeader>

        <ModalBody className="px-6 pb-0 pt-5">
          {options.length === 0 ? (
            <View
              className="rounded-[22px] border px-4 py-5"
              style={{ backgroundColor: CARD_ALT, borderColor: STROKE }}
            >
              <Text className="text-center leading-6" style={{ color: TEXT_SOFT }}>
                {emptyMessage}
              </Text>
            </View>
          ) : (
            options.map((option) => {
              const selected = option.value === selectedValue;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  className="mb-3 rounded-[20px] border px-4 py-4"
                  style={{
                    backgroundColor: selected ? "rgba(34,197,94,0.12)" : CARD_ALT,
                    borderColor: selected ? "rgba(34,197,94,0.22)" : STROKE,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-white">
                        {option.label}
                      </Text>
                      {option.helper ? (
                        <Text className="mt-1 text-[13px]" style={{ color: TEXT_SOFT }}>
                          {option.helper}
                        </Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? "check-circle" : "circle-outline"}
                      size={22}
                      color={selected ? GREEN : "#64748B"}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ModalBody>

        <ModalFooter className="px-6 pb-6 pt-5">
          <Pressable
            onPress={onClose}
            className="h-12 flex-1 items-center justify-center rounded-[18px]"
            style={{ backgroundColor: INPUT }}
          >
            <Text className="text-[15px] font-medium text-white">Fechar</Text>
          </Pressable>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SchedulePickupScreen;

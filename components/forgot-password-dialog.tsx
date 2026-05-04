import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

interface ForgotPassowrdDialogProps {
  onSuccessCallback: (email: string) => void;
  trigger?: React.ReactNode;
}

type FormData = {
  email: string;
};

const ForgotPasswordDialog: React.FC<ForgotPassowrdDialogProps> = ({
  trigger,
  onSuccessCallback,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: FormData) => {
    setOpen(false);
    onSuccessCallback(data.email);
    reset(); // limpa o campo depois
  };

  return (
    <>
      {/* TRIGGER */}
      <Pressable onPress={() => setOpen(true)}>
        {trigger || <Text className="text-blue-500">Esqueci minha senha</Text>}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/70 px-6">
          <Pressable
            className="absolute inset-0"
            onPress={() => setOpen(false)}
          />

          <View className="rounded-[24px] border border-[#1F2937] bg-[#111827] px-6 py-5">
            {/* HEADER */}
            <View className="flex-row items-center justify-between">
              <Text className="text-[20px] font-semibold text-white">
                Recuperar senha
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-[22px] text-[#A3A3A3]">x</Text>
              </Pressable>
            </View>

            {/* DESCRIPTION */}
            <Text className="mt-3 text-[15px] leading-6 text-[#A3A3A3]">
              Informe seu e-mail para receber o link de recuperação.
            </Text>

            {/* INPUT CONTROLADO */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: "E-mail é obrigatório",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "E-mail inválido",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Seu e-mail"
                  placeholderTextColor="#6B7280"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`mt-4 rounded-xl border px-4 py-4 text-white ${
                    errors.email ? "border-red-500" : "border-[#27303A]"
                  } bg-[#020617]`}
                />
              )}
            />

            {/* ERROR */}
            {errors.email && (
              <Text className="mt-2 text-sm text-red-500">
                {errors.email.message}
              </Text>
            )}

            {/* ACTIONS */}
            <View className="mt-6 flex-row gap-3">
              <Pressable
                className="flex-1 items-center justify-center rounded-2xl border border-[#27303A] px-4 py-4"
                onPress={() => setOpen(false)}
              >
                <Text className="text-[15px] font-medium text-white">
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 items-center justify-center rounded-2xl bg-[#65C90F] px-4 py-4"
                onPress={handleSubmit(onSubmit)}
              >
                <Text className="text-[15px] font-semibold text-[#071100]">
                  Enviar link
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ForgotPasswordDialog;

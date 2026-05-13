import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import z from "zod";

interface ForgotPassowrdDialogProps {
  onSuccessCallback: (email: string) => void;
  trigger?: React.ReactNode;
  loading?: boolean;
}

const forgotPasswordSchema = z.object({
  email: z.string(),
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordDialog: React.FC<ForgotPassowrdDialogProps> = ({
  trigger,
  loading,
  onSuccessCallback,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordSchemaType>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordSchemaType) => {
    setOpen(false);
    onSuccessCallback(data.email);
    reset();
  };

  return (
    <>
      {/* TRIGGER */}
      {trigger || (
        <Pressable
          onPress={() => setOpen(true)}
          className="self-end mt-4 mb-2"
          disabled={loading}
          hitSlop={10}
          style={({ pressed }) => ({
            opacity: pressed && !loading ? 0.72 : 1,
          })}
        >
          <Text
            className="text-[#6FC72C] text-[14px] font-medium"
            style={{ fontFamily: "System" }}
          >
            Esqueceu a senha?
          </Text>
        </Pressable>
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-center bg-[#000000]px-6">
          <Pressable
            className="absolute inset-0"
            onPress={() => setOpen(false)}
          />

          <View className="rounded-[24px] border border-[#1F2937] bg-[#000000] px-6 py-5">
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
                  } bg-black/90`}
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

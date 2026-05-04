import { db } from "@/services/_firebase";
import { doc, getDoc, getDocFromCache, setDoc } from "firebase/firestore";

export class FirestoreServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirestoreServiceError";
  }
}

export type DonorData = {
  documento: string;
  tipoDocumento: "cpf" | "cnpj";
  endereco: string;
  tipoUsuario: "doador";
  atualizadoEm: string;
};

const normalizeTipoUsuario = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

const getFirebaseErrorCode = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: unknown }).code ?? "");
  }

  return "";
};

export const salvarDoador = async (
  uid: string,
  data: Omit<DonorData, "tipoUsuario" | "atualizadoEm">
): Promise<void> => {
  if (!db) {
    throw new FirestoreServiceError(
      "Banco de dados não configurado. Verifique as variáveis de ambiente do Firebase."
    );
  }

  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        ...data,
        tipoUsuario: "doador",
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Erro ao salvar doador:", error);
    throw new FirestoreServiceError(
      "Não foi possível salvar os dados. Tente novamente."
    );
  }
};

export const verificarUsuarioDoador = async (uid: string): Promise<boolean> => {
  if (!uid.trim()) {
    return false;
  }

  if (!db) {
    throw new FirestoreServiceError(
      "Banco de dados não configurado. Verifique as variáveis de ambiente do Firebase."
    );
  }

  try {
    const userRef = doc(db, "users", uid);

    try {
      const cachedSnapshot = await getDocFromCache(userRef);

      if (cachedSnapshot.exists()) {
        return normalizeTipoUsuario(cachedSnapshot.data().tipoUsuario) === "doador";
      }
    } catch {
      // Ignora cache vazio e segue para consulta principal.
    }

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return false;
    }

    return normalizeTipoUsuario(userSnapshot.data().tipoUsuario) === "doador";
  } catch (error) {
    const errorCode = getFirebaseErrorCode(error);

    if (errorCode === "unavailable" || errorCode === "failed-precondition") {
      return false;
    }

    console.error("Erro ao verificar se o usuário é doador:", error);
    throw new FirestoreServiceError(
      "Não foi possível verificar o tipo do usuário. Tente novamente."
    );
  }
};

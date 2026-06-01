import { db } from "@/services/_firebase";
import { MotivoRecusa, SolicitacaoComId } from "@/types";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FirestoreServiceError } from "./_firestore";

export const buscarSolicitacoesRecebidasDoDoador = async (
  doadorId: string
): Promise<SolicitacaoComId[]> => {
  if (!db) {
    throw new FirestoreServiceError("Banco de dados não configurado.");
  }

  try {
    const q = query(
      collection(db, "solicitacoes"),
      where("doadorId", "==", doadorId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SolicitacaoComId, "id">),
    }));
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    throw new FirestoreServiceError(
      "Não foi possível carregar as solicitações. Tente novamente."
    );
  }
};

export const aceitarSolicitacao = async (
  solicitacaoId: string,
  doacaoId: string
): Promise<void> => {
  if (!db) {
    throw new FirestoreServiceError("Banco de dados não configurado.");
  }

  const solicitacaoRef = doc(db, "solicitacoes", solicitacaoId);
  const doacaoRef = doc(db, "donations", doacaoId);

  await runTransaction(db, async (transaction) => {
    const doacaoSnap = await transaction.get(doacaoRef);

    if (!doacaoSnap.exists()) {
      throw new FirestoreServiceError("Doação não encontrada.");
    }

    const solicitacoesSnapshot = await getDocs(
      query(
        collection(db!, "solicitacoes"),
        where("doacaoId", "==", doacaoId),
        where("status", "==", "em_analise")
      )
    );

    transaction.update(solicitacaoRef, {
      status: "aprovada",
      atualizadoEm: serverTimestamp(),
    });

    transaction.update(doacaoRef, {
      status: "rejeitada",
    });

    solicitacoesSnapshot.docs.forEach((d) => {
      if (d.id !== solicitacaoId) {
        transaction.update(d.ref, {
          status: "rejeitada",
          motivoRecusa: "Doação já realizada",
          atualizadoEm: serverTimestamp(),
        });
      }
    });
  });
};

export const recusarSolicitacao = async (
  solicitacaoId: string,
  doacaoId: string,
  motivo: MotivoRecusa
): Promise<void> => {
  if (!db) {
    throw new FirestoreServiceError("Banco de dados não configurado.");
  }

  const solicitacaoRef = doc(db, "solicitacoes", solicitacaoId);
  const doacaoRef = doc(db, "donations", doacaoId);

  await updateDoc(solicitacaoRef, {
    status: "rejeitada",
    motivoRecusa: motivo,
    atualizadoEm: serverTimestamp(),
  });

  await updateDoc(doacaoRef, {
    status: "disponivel",
    reivindicadoPor: null,
  });
};
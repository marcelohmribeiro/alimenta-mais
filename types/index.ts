import type { ImagePickerAsset } from "expo-image-picker";

export type DonationStatus =
  | "disponivel"
  | "em análise"
  | "aprovado"
  | "cancelada"
  | "rejeitada";

export type Donation = {
  tipoAlimento: string;
  quantidade: string;
  descricao: string;
  validade: string;
  localizacao: string;
  latitude?: number | null;
  longitude?: number | null;
  disponibilidade: string;
  perecivel: boolean;
  observacoes?: string;
  status: DonationStatus;
  donorId: string | null;
  reivindicadoPor?: string | null;
  createdAt: unknown;
};

export type UserProfile = {
  nome: string;
  email: string;
  telefone: string;
  fotoPerfil: string;
  tipoUsuario: string;
};

export type DonorData = {
  documento: string;
  tipoDocumento: "cpf" | "cnpj";
  endereco: string;
  tipoUsuario: "doador";
  atualizadoEm: string;
};

type TipoRetirada = "doador" | "buscador";

export type CloudinaryImageAsset = {
  secureUrl: string;
  publicId: string;
  assetId: string;
};

export type CloudinaryImageUploadResult = CloudinaryImageAsset & {
  deleteToken?: string | null;
};

export type DonationPhotoInput = Pick<
  ImagePickerAsset,
  "uri" | "mimeType" | "fileName" | "file"
>;

export type SalvarDoacaoParams = {
  userId: string | null;
  fotos: DonationPhotoInput[];
  nomeAlimento: string;
  categoria: string;
  quantidade: string;
  tipoAlimento: string;
  validade: string;
  descricao: string;
  retirada: TipoRetirada;
  dataRetirada: string;
  horarioInicio: string;
  horarioFim: string;
  endereco: string;
};

export type DonationDocument = Donation & {
  fotos: CloudinaryImageAsset[];
  categoria: string;
  tipoRetirada: TipoRetirada;
  dataRetirada: string;
  horarioInicio: string;
  horarioFim: string;
};

export type DonationDocumentWithId = DonationDocument & {
  id: string;
};

export type CloudinaryUploadOptions = {
  folder?: string;
};

type CloudinaryUploadApiError = {
  message?: string;
};

export type CloudinaryUploadApiResponse = {
  asset_id?: string;
  public_id?: string;
  secure_url?: string;
  delete_token?: string;
  error?: CloudinaryUploadApiError;
  result?: string;
};

export type ParsedCloudinaryResponse = {
  payload: CloudinaryUploadApiResponse | null;
  rawText: string;
};

export type SolicitacaoStatus = "pendente" | "aceita" | "recusada";

export type MotivoRecusa =
  | "Alimento venceu"
  | "Alimento estragou"
  | "Não consigo fazer essa entrega"
  | "Não consigo entregar no dia combinado"
  | "Doação já realizada";

export type Solicitacao = {
  id?: string;
  doacaoId: string;
  doadorId: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteAvatar: string | null;
  doacaoTitulo: string;
  doacaoQuantidade: string;
  doacaoValidade: string;
  doacaoCategoria: string;
  status: SolicitacaoStatus;
  motivoRecusa?: MotivoRecusa | null;
  criadoEm: unknown;
  atualizadoEm?: unknown;
};

export type SolicitacaoComId = Solicitacao & { id: string };

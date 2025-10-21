// Enums based on mockApi.ts
export enum ImovelStatus {
  Ativo = 'Ativo',
  Inativo = 'Inativo',
  Vendido = 'Vendido',
  Alugado = 'Alugado',
}

export enum Finalidade {
  Venda = 'Venda',
  Aluguel = 'Aluguel',
}

export enum ClienteStatus {
  Ativo = 'Ativo',
  Inativo = 'Inativo',
}

export enum MatchStatus {
  Aberto = 'aberto',
  Convertido = 'convertido',
  Fechado = 'fechado',
  ReaberturaPendente = 'reabertura_pendente',
  ChatDireto = 'chat_direto', // Novo status para chats iniciados fora do Matchmaking
}

export enum ReadStatus {
  Lido = 'lido',
  NaoLido = 'nao lido',
}

export enum ParceriaStatus {
    Concluida = 'concluida',
    Cancelada = 'cancelada',
}


// Interfaces based on mockApi.ts and other files
export interface Corretor {
  ID_Corretor: string;
  Nome: string;
  CRECI: string;
  Telefone: string;
  Email: string;
  Cidade: string;
  Estado: string;
  username?: string;
  avatar_url?: string;
  whatsapp_notifications_enabled?: boolean;
}

export interface Imovel {
  ID_Imovel: string;
  ID_Corretor: string;
  Tipo: string;
  Finalidade: Finalidade;
  Cidade: string;
  Estado: string;
  Bairro: string;
  Valor: number;
  Dormitorios: number;
  Metragem?: number;
  Status: ImovelStatus;
  Imagens?: string[];
  detalhes_privados?: string;
  CreatedAt: string;
}

export interface Cliente {
  ID_Cliente: string;
  ID_Corretor: string;
  TipoImovelDesejado: string;
  Finalidade: Finalidade;
  CidadeDesejada: string;
  EstadoDesejado: string;
  BairroRegiaoDesejada: string;
  FaixaValorMin: number;
  FaixaValorMax: number;
  DormitoriosMinimos: number;
  Status: ClienteStatus;
  detalhes_privados?: string;
  CreatedAt: string;
}

export interface Match {
  ID_Match: string;
  ID_Imovel: string;
  ID_Cliente: string;
  Corretor_A_ID: string;
  Corretor_B_ID: string;
  Match_Timestamp: string;
  Status: MatchStatus;
  status_change_requester_id?: string;
}

export interface Message {
  ID_Message: string;
  ID_Match: string | null;
  ID_Parceria: string | null;
  From_Corretor_ID: string;
  To_Corretor_ID: string;
  Timestamp: string;
  Message_Text: string;
  Read_Status: ReadStatus;
}

export interface Parceria {
    ID_Parceria: string;
    ID_Imovel: string;
    ID_Cliente: string;
    CorretorA_ID: string;
    CorretorB_ID: string;
    DataFechamento: string;
    Status: ParceriaStatus;
}

export interface Metric {
    ID_Corretor: string;
    Nome: string;
    Imoveis_Adicionados: number;
    Clientes_Adicionados: number;
    Matches_Iniciados: number;
    Conversas_Iniciadas: number;
    Parcerias_Concluidas: number;
    Taxa_Conversao: number;
    Score: number;
    Seguidores: number;
    Seguindo: number; // Adicionado
}

// From AuthContext
export interface User {
  id: string;
  email: string;
  corretorInfo: Corretor;
}
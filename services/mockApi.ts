import { Corretor, Imovel, ImovelStatus, Finalidade, Cliente, ClienteStatus, Match, MatchStatus, Message, ReadStatus, Parceria, ParceriaStatus, Metric } from '../types';

// --- MOCK DATABASE ---
let corretores: Corretor[] = [
  { ID_Corretor: 'c1', Nome: 'Ana Silva', CRECI: '12345-F', Telefone: '11987654321', Email: 'ana.silva@email.com', Cidade: 'São Paulo' },
  { ID_Corretor: 'c2', Nome: 'Bruno Costa', CRECI: '67890-F', Telefone: '21912345678', Email: 'bruno.costa@email.com', Cidade: 'Rio de Janeiro' },
  { ID_Corretor: 'c3', Nome: 'Carlos Dias', CRECI: '11223-F', Telefone: '31955554444', Email: 'carlos.dias@email.com', Cidade: 'Belo Horizonte' },
];

let imoveis: Imovel[] = [
  { ID_Imovel: 'i1', ID_Corretor: 'c1', Tipo: 'Apartamento', Finalidade: Finalidade.Venda, Cidade: 'São Paulo', Bairro: 'Pinheiros', Valor: 850000, Dormitorios: 2, Status: ImovelStatus.Ativo },
  { ID_Imovel: 'i2', ID_Corretor: 'c2', Tipo: 'Casa', Finalidade: Finalidade.Aluguel, Cidade: 'Rio de Janeiro', Bairro: 'Copacabana', Valor: 4500, Dormitorios: 3, Status: ImovelStatus.Ativo },
  { ID_Imovel: 'i3', ID_Corretor: 'c1', Tipo: 'Cobertura', Finalidade: Finalidade.Venda, Cidade: 'São Paulo', Bairro: 'Jardins', Valor: 2500000, Dormitorios: 4, Status: ImovelStatus.Ativo },
  { ID_Imovel: 'i4', ID_Corretor: 'c3', Tipo: 'Apartamento', Finalidade: Finalidade.Venda, Cidade: 'Belo Horizonte', Bairro: 'Savassi', Valor: 600000, Dormitorios: 3, Status: ImovelStatus.Ativo },
];

let clientes: Cliente[] = [
  { ID_Cliente: 'cl1', ID_Corretor: 'c2', TipoImovelDesejado: 'Apartamento', Finalidade: Finalidade.Venda, CidadeDesejada: 'São Paulo', BairroRegiaoDesejada: 'Pinheiros,Vila Madalena', FaixaValorMin: 700000, FaixaValorMax: 900000, DormitoriosMinimos: 2, Status: ClienteStatus.Ativo },
  { ID_Cliente: 'cl2', ID_Corretor: 'c1', TipoImovelDesejado: 'Casa', Finalidade: Finalidade.Aluguel, CidadeDesejada: 'Rio de Janeiro', BairroRegiaoDesejada: 'Copacabana,Ipanema', FaixaValorMin: 4000, FaixaValorMax: 5000, DormitoriosMinimos: 3, Status: ClienteStatus.Ativo },
  { ID_Cliente: 'cl3', ID_Corretor: 'c3', TipoImovelDesejado: 'Apartamento', Finalidade: Finalidade.Venda, CidadeDesejada: 'São Paulo', BairroRegiaoDesejada: 'Jardins', FaixaValorMin: 2000000, FaixaValorMax: 3000000, DormitoriosMinimos: 3, Status: ClienteStatus.Ativo },
];

let matches: Match[] = [
    { ID_Match: 'm1', ID_Imovel: 'i1', ID_Cliente: 'cl1', Corretor_A_ID: 'c1', Corretor_B_ID: 'c2', Match_Timestamp: new Date().toISOString(), Status: MatchStatus.Aberto },
];

let messages: Message[] = [
    { ID_Message: 'msg1', ID_Match: 'm1', ID_Parceria: null, From_Corretor_ID: 'c2', To_Corretor_ID: 'c1', Timestamp: new Date(Date.now() - 60000 * 5).toISOString(), Message_Text: 'Olá Ana, tudo bem? Vi que seu imóvel em Pinheiros deu match com meu cliente. Ele tem interesse!', Read_Status: ReadStatus.Lido },
    { ID_Message: 'msg2', ID_Match: 'm1', ID_Parceria: null, From_Corretor_ID: 'c1', To_Corretor_ID: 'c2', Timestamp: new Date(Date.now() - 60000 * 4).toISOString(), Message_Text: 'Oi Bruno! Que ótima notícia. O imóvel está disponível para visitas. Quando seria bom para ele?', Read_Status: ReadStatus.NaoLido },
];

let parcerias: Parceria[] = [];

// --- API FUNCTIONS ---

const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));
};

const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(16).slice(2)}`;

// Imóveis
export const getImoveis = async (filters: any = {}): Promise<Imovel[]> => simulateDelay(imoveis);
export const getImoveisByCorretor = async (corretorId: string): Promise<Imovel[]> => simulateDelay(imoveis.filter(i => i.ID_Corretor === corretorId));
export const createImovel = async (imovelData: Omit<Imovel, 'ID_Imovel' | 'Status'>): Promise<Imovel> => {
    const newImovel: Imovel = {
        ...imovelData,
        ID_Imovel: generateId('i'),
        Status: ImovelStatus.Ativo,
    };
    imoveis.push(newImovel);
    return simulateDelay(newImovel);
};

// Clientes
export const getClientes = async (filters: any = {}): Promise<Cliente[]> => simulateDelay(clientes);
export const getClientesByCorretor = async (corretorId: string): Promise<Cliente[]> => simulateDelay(clientes.filter(c => c.ID_Corretor === corretorId));
export const createCliente = async (clienteData: Omit<Cliente, 'ID_Cliente' | 'Status'>): Promise<Cliente> => {
    const newCliente: Cliente = {
        ...clienteData,
        ID_Cliente: generateId('cl'),
        Status: ClienteStatus.Ativo,
    };
    clientes.push(newCliente);
    return simulateDelay(newCliente);
};

// Matches
export const findMatchesForImovel = async (imovel: Imovel): Promise<Match[]> => {
    const newMatches: Match[] = [];
    for (const cliente of clientes) {
        if (
            cliente.ID_Corretor !== imovel.ID_Corretor &&
            cliente.CidadeDesejada.toLowerCase() === imovel.Cidade.toLowerCase() &&
            (cliente.BairroRegiaoDesejada.toLowerCase().includes(imovel.Bairro.toLowerCase()) || cliente.BairroRegiaoDesejada === '') &&
            imovel.Valor >= cliente.FaixaValorMin && imovel.Valor <= cliente.FaixaValorMax &&
            imovel.Dormitorios >= cliente.DormitoriosMinimos &&
            !matches.some(m => m.ID_Imovel === imovel.ID_Imovel && m.ID_Cliente === cliente.ID_Cliente) // Evita duplicados
        ) {
            const newMatch: Match = {
                ID_Match: generateId('m'),
                ID_Imovel: imovel.ID_Imovel,
                ID_Cliente: cliente.ID_Cliente,
                Corretor_A_ID: imovel.ID_Corretor,
                Corretor_B_ID: cliente.ID_Corretor,
                Match_Timestamp: new Date().toISOString(),
                Status: MatchStatus.Aberto,
            };
            matches.push(newMatch);
            newMatches.push(newMatch);
        }
    }
    return simulateDelay(newMatches);
};
// findMatchesForCliente can be implemented similarly
export const getMatchesByCorretor = async (corretorId: string): Promise<Match[]> => {
    return simulateDelay(matches.filter(m => m.Corretor_A_ID === corretorId || m.Corretor_B_ID === corretorId));
};

export const getMatchById = async (matchId: string): Promise<Match | undefined> => {
    return simulateDelay(matches.find(m => m.ID_Match === matchId));
};

// Chat
export const getMessagesByMatch = async (matchId: string): Promise<Message[]> => {
    return simulateDelay(messages.filter(msg => msg.ID_Match === matchId).sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()));
};
export const sendMessage = async (messageData: Omit<Message, 'ID_Message' | 'Timestamp' | 'Read_Status'>): Promise<Message> => {
    const newMessage: Message = {
        ...messageData,
        ID_Message: generateId('msg'),
        Timestamp: new Date().toISOString(),
        Read_Status: ReadStatus.NaoLido
    };
    messages.push(newMessage);
    return simulateDelay(newMessage);
}

// Parcerias
export const createParceria = async (parceriaData: Omit<Parceria, 'ID_Parceria' | 'DataFechamento' | 'Status'>): Promise<Parceria> => {
    const newParceria: Parceria = {
        ...parceriaData,
        ID_Parceria: generateId('p'),
        DataFechamento: new Date().toISOString(),
        Status: ParceriaStatus.Concluida
    };
    parcerias.push(newParceria);
    
    // Update match status
    const relatedMatch = matches.find(m => m.ID_Imovel === parceriaData.ID_Imovel && m.ID_Cliente === parceriaData.ID_Cliente);
    if (relatedMatch) {
        relatedMatch.Status = MatchStatus.Convertido;
    }
    
    return simulateDelay(newParceria);
};

export const getParceriasByCorretor = async (corretorId: string): Promise<Parceria[]> => {
    return simulateDelay(parcerias.filter(p => p.CorretorA_ID === corretorId || p.CorretorB_ID === corretorId));
};

// Métricas
export const getMetricas = async (): Promise<Metric[]> => {
    const metrics: Metric[] = corretores.map(corretor => {
        const imoveisAdicionados = imoveis.filter(i => i.ID_Corretor === corretor.ID_Corretor).length;
        const clientesAdicionados = clientes.filter(c => c.ID_Corretor === corretor.ID_Corretor).length;
        const matchesIniciados = matches.filter(m => m.Corretor_A_ID === corretor.ID_Corretor || m.Corretor_B_ID === corretor.ID_Corretor).length;
        const conversasIniciadas = messages.filter(msg => msg.From_Corretor_ID === corretor.ID_Corretor).length;
        const parceriasConcluidas = parcerias.filter(p => (p.CorretorA_ID === corretor.ID_Corretor || p.CorretorB_ID === corretor.ID_Corretor) && p.Status === ParceriaStatus.Concluida).length;
        const taxaConversao = matchesIniciados > 0 ? parceriasConcluidas / matchesIniciados : 0;

        return {
            ID_Corretor: corretor.ID_Corretor,
            Nome: corretor.Nome,
            Imoveis_Adicionados: imoveisAdicionados,
            Clientes_Adicionados: clientesAdicionados,
            Matches_Iniciados: matchesIniciados,
            Conversas_Iniciadas: conversasIniciadas,
            Parcerias_Concluidas: parceriasConcluidas,
            Taxa_Conversao: taxaConversao
        };
    });

    return simulateDelay(metrics.sort((a,b) => b.Parcerias_Concluidas - a.Parcerias_Concluidas));
}
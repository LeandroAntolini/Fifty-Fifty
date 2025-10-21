import React from 'react';
import { Button } from './ui/Button';
import { Award, Star, MessageSquare, ThumbsUp, Home, Users } from 'lucide-react';

interface RankingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RankingInfoModal: React.FC<RankingInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-bold text-primary flex items-center">
                <Award className="mr-2" /> Entenda o Ranking
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                X
            </Button>
        </div>
        
        <div className="space-y-4 text-sm text-neutral-dark">
            <section>
                <h3 className="font-semibold text-md mb-2">Sistema de Pontuação (Score)</h3>
                <p className="mb-3">Seu Score é a base do ranking e é calculado com base nas suas atividades na plataforma. Quanto mais você colabora, mais pontos acumula!</p>
                <ul className="space-y-2">
                    <li className="flex items-start"><Star className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+100 pontos:</span>&nbsp;por cada Parceria Concluída.</li>
                    <li className="flex items-start"><MessageSquare className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+15 pontos:</span>&nbsp;ao iniciar uma conversa em um Match.</li>
                    <li className="flex items-start"><ThumbsUp className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+10 pontos:</span>&nbsp;para cada novo Match gerado.</li>
                    <li className="flex items-start"><Home className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+5 pontos:</span>&nbsp;para cada Imóvel ou Cliente cadastrado.</li>
                    <li className="flex items-start"><Users className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+1 ponto:</span>&nbsp;por cada Corretor que você segue.</li>
                    <li className="flex items-start"><Users className="text-secondary h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold text-green-600">+1 ponto:</span>&nbsp;por cada Corretor que te segue.</li>
                </ul>
            </section>

            <section className="pt-4 border-t">
                <h3 className="font-semibold text-md mb-2">Premiações e Reconhecimento</h3>
                <p className="mb-2">Para incentivar os corretores mais engajados, temos um sistema de premiação mensal.</p>
                <p><span className="font-bold">🏆 Prêmios do Mês:</span> Ao final de cada mês, os 3 corretores com o maior SCORE no ranking da sua cidade serão premiados!</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><span className="font-semibold">1º, 2º e 3º lugar:</span> Ganham 1 semana de destaque gratuito no espaço publicitário da tela de Início para divulgar um imóvel de sua escolha.</li>
                    <li>Os vencedores serão coroados com medalhas (🥇🥈🥉) em seu perfil durante o mês seguinte.</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">O ranking mensal é zerado no primeiro dia de cada mês para dar novas oportunidades a todos. O ranking geral ("Hall da Fama") continua acumulando pontos indefinidamente.</p>
            </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>Entendi</Button>
        </div>
      </div>
    </div>
  );
};

export default RankingInfoModal;
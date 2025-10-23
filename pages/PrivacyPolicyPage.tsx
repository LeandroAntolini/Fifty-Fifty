import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="space-y-4 text-sm text-neutral-dark">
            <Card>
                <CardHeader>
                    <CardTitle>Política de Privacidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Última atualização:</strong> 26 de Julho de 2024</p>
                    
                    <p>A sua privacidade é importante para nós. É política do Fifty-Fifty respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no aplicativo Fifty-Fifty.</p>

                    <h3 className="font-semibold text-md pt-2">1. Informações que coletamos</h3>
                    <p>Coletamos informações que você nos fornece diretamente, como quando você cria uma conta, cadastra um imóvel ou cliente, e se comunica conosco. Isso pode incluir seu nome, CRECI, e-mail, telefone, e detalhes dos imóveis e clientes.</p>
                    <p>Além disso, coletamos dados de engajamento e atividade na plataforma para calcular seu Score e Ranking, incluindo: número de imóveis e clientes cadastrados, matches iniciados, conversas iniciadas e parcerias concluídas.</p>

                    <h3 className="font-semibold text-md pt-2">2. Como usamos as suas informações</h3>
                    <p>Usamos as informações que coletamos para operar, manter e fornecer os recursos e a funcionalidade do aplicativo, incluindo:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Facilitar os "matches" entre imóveis e clientes.</li>
                        <li>Permitir a comunicação entre corretores.</li>
                        <li>Personalizar sua experiência.</li>
                        <li>Para fins de suporte ao cliente.</li>
                        <li>**Exibir seu Score e posição no Ranking** para outros corretores na plataforma.</li>
                        <li>**Gerenciar a funcionalidade de Seguir/Seguidores**, tornando seu perfil (nome, CRECI, cidade, estado e foto) visível para todos os usuários.</li>
                    </ul>

                    <h3 className="font-semibold text-md pt-2">3. Segurança dos dados</h3>
                    <p>Empregamos medidas de segurança para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro.</p>
                    <p>Note que os detalhes privados de Imóveis e Clientes (como endereço, nome do cliente e contatos) são visíveis apenas para você e o corretor parceiro no chat, e não são divulgados publicamente.</p>

                    <h3 className="font-semibold text-md pt-2">4. Seus direitos</h3>
                    <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através da página do seu perfil ou entrando em contato com o suporte.</p>

                    <h3 className="font-semibold text-md pt-2">5. Alterações a esta política</h3>
                    <p>Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações, publicando a nova Política de Privacidade nesta página.</p>

                    <p className="pt-4">Se tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através do e-mail de suporte.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrivacyPolicyPage;
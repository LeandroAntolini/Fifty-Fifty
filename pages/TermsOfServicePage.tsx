import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const TermsOfServicePage: React.FC = () => {
    return (
        <div className="space-y-4 text-sm text-neutral-dark">
            <Card>
                <CardHeader>
                    <CardTitle>Termos de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Última atualização:</strong> 26 de Julho de 2024</p>
                    
                    <p>Ao acessar e usar o aplicativo Fifty-Fifty, você concorda em cumprir estes Termos de Serviço.</p>

                    <h3 className="font-semibold text-md pt-2">1. Uso do Serviço</h3>
                    <p>O Fifty-Fifty é uma plataforma B2B destinada exclusivamente a corretores de imóveis com CRECI ativo. Você concorda em fornecer informações verdadeiras, precisas e completas ao se registrar e usar o serviço.</p>

                    <h3 className="font-semibold text-md pt-2">2. Responsabilidades do Usuário</h3>
                    <p>Você é responsável por todas as atividades que ocorrem em sua conta. Você concorda em:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Manter a confidencialidade de sua senha.</li>
                        <li>Não compartilhar sua conta com terceiros.</li>
                        <li>Usar o serviço de forma profissional e ética.</li>
                        <li>Respeitar os acordos de parceria (50/50) estabelecidos através da plataforma.</li>
                        <li>**Garantir a veracidade dos dados** de Imóveis e Clientes cadastrados, pois eles impactam o sistema de Matchmaking e o seu Score no Ranking.</li>
                    </ul>

                    <h3 className="font-semibold text-md pt-2">3. Atividades Proibidas</h3>
                    <p>É estritamente proibido usar o serviço para qualquer finalidade ilegal, fraudulenta ou para violar os direitos de outros. Isso inclui:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>O cadastro de informações falsas de imóveis ou clientes.</li>
                        <li>A manipulação do sistema de Score ou Ranking através de atividades não genuínas.</li>
                        <li>O uso da função "Seguir" para fins de spam ou assédio a outros corretores.</li>
                    </ul>

                    <h3 className="font-semibold text-md pt-2">4. Rescisão</h3>
                    <p>Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, por qualquer violação destes Termos.</p>

                    <h3 className="font-semibold text-md pt-2">5. Isenção de Garantia</h3>
                    <p>O serviço é fornecido "como está". Não garantimos que o serviço será ininterrupto, livre de erros ou que todos os "matches" resultarão em parcerias bem-sucedidas.</p>

                    <p className="pt-4">Se tiver alguma dúvida sobre estes Termos de Serviço, entre em contato conosco.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default TermsOfServicePage;
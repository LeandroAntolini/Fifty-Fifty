import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { User as UserIcon, Edit2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { Switch } from '../components/ui/Switch';
import * as api from '../services/api';
import { formatPhoneNumber, toTitleCase } from '../src/utils/formatters';

const ProfilePage: React.FC = () => {
    const { user, updateProfile, loading: authLoading, deleteAccount, logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        Nome: '',
        Telefone: '',
        Cidade: '',
        Estado: '',
    });
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
    const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(true);
    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
    const [isWhatsAppConfigured, setIsWhatsAppConfigured] = useState(true);
    const [checkingConfig, setCheckingConfig] = useState(true);

    useEffect(() => {
        if (user) {
            setFormData({
                Nome: user.corretorInfo.Nome,
                Telefone: formatPhoneNumber(user.corretorInfo.Telefone),
                Cidade: user.corretorInfo.Cidade,
                Estado: user.corretorInfo.Estado,
            });
            setAvatarPreview(user.corretorInfo.avatar_url || null);
            setWhatsappNotificationsEnabled(user.corretorInfo.whatsapp_notifications_enabled ?? true);
            setEmailNotificationsEnabled(user.corretorInfo.email_notifications_enabled ?? true);
        }
    }, [user]);

    useEffect(() => {
        const checkConfig = async () => {
            setCheckingConfig(true);
            try {
                const { isConfigured } = await api.checkWhatsAppConfig();
                setIsWhatsAppConfigured(isConfigured);
            } catch (e) {
                setIsWhatsAppConfigured(false); 
            } finally {
                setCheckingConfig(false);
            }
        };
        checkConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'Telefone') {
            setFormData({ ...formData, [name]: formatPhoneNumber(value) });
            return;
        }

        let finalValue = value;
        if (name === 'Estado') {
            finalValue = value.toUpperCase();
        } else if (name === 'Nome' || name === 'Cidade') {
            finalValue = toTitleCase(value);
        }

        setFormData({ ...formData, [name]: finalValue });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const profileDataToSave = {
                ...formData,
                Telefone: formData.Telefone.replace(/\D/g, ''), // Salva apenas os dígitos
                whatsapp_notifications_enabled: whatsappNotificationsEnabled,
                email_notifications_enabled: emailNotificationsEnabled,
            };
            await updateProfile(profileDataToSave, avatarFile);
            toast.success('Perfil atualizado com sucesso!');
            setAvatarFile(null);
        } catch (err) {
            toast.error('Falha ao atualizar o perfil. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteAccountConfirm(true);
    };

    const confirmDeleteAccount = async () => {
        setShowDeleteAccountConfirm(false);
        setLoading(true);
        try {
            await deleteAccount();
            toast.success('Conta excluída com sucesso.');
            navigate('/login');
        } catch (err) {
            toast.error('Falha ao excluir a conta. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="relative">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                        <UserIcon className="w-12 h-12 text-gray-500" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5"
                                    aria-label="Alterar foto do perfil"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="Email">Email</Label>
                            <Input id="Email" name="Email" type="email" value={user.email} disabled className="bg-neutral-light" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="CRECI">CRECI</Label>
                            <Input id="CRECI" name="CRECI" value={user.corretorInfo.CRECI} disabled className="bg-neutral-light" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="Nome">Nome Completo</Label>
                            <Input id="Nome" name="Nome" value={formData.Nome} onChange={handleChange} required />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="Telefone">Telefone / WhatsApp</Label>
                            <Input id="Telefone" name="Telefone" value={formData.Telefone} onChange={handleChange} required maxLength={15} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label htmlFor="Cidade">Cidade</Label>
                                <Input id="Cidade" name="Cidade" value={formData.Cidade} onChange={handleChange} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="Estado">Estado</Label>
                                <Input id="Estado" name="Estado" value={formData.Estado} onChange={handleChange} required maxLength={2} />
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Notificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {checkingConfig ? (
                        <div className="flex justify-center"><Spinner size="sm" /></div>
                    ) : !isWhatsAppConfigured ? (
                        <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-start">
                            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Ação necessária</p>
                                <p>As notificações por WhatsApp não estão ativas na plataforma. Para habilitá-las, o administrador precisa configurar as chaves da API do WhatsApp no painel do sistema.</p>
                            </div>
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="whatsapp-notifications" className={`flex flex-col space-y-1 pr-4 ${!isWhatsAppConfigured ? 'opacity-50' : ''}`}>
                            <span>Notificações via WhatsApp</span>
                            <span className="font-normal leading-snug text-muted-foreground text-sm">
                                Receba alertas de novos matches e mensagens.
                            </span>
                        </Label>
                        <Switch
                            id="whatsapp-notifications"
                            checked={whatsappNotificationsEnabled}
                            onCheckedChange={setWhatsappNotificationsEnabled}
                            disabled={!isWhatsAppConfigured}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications" className="flex flex-col space-y-1 pr-4">
                            <span>Notificações via E-mail</span>
                            <span className="font-normal leading-snug text-muted-foreground text-sm">
                                Receba alertas de novos matches e mensagens.
                            </span>
                        </Label>
                        <Switch
                            id="email-notifications"
                            checked={emailNotificationsEnabled}
                            onCheckedChange={setEmailNotificationsEnabled}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/profile/update-password')}>
                        Atualizar Senha
                    </Button>
                    <Button variant="outline" className="w-full" onClick={logout}>
                        Sair (Logout)
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleDeleteAccount} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Excluir Conta'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Sobre o Aplicativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Versão</p>
                        <p>1.0.0</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Suporte Técnico</p>
                        <a href="mailto:fiftyfiftyimob@gmail.com" className="text-primary hover:underline">enviar e-mail</a>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Enviar Feedback</p>
                        <a href="mailto:fiftyfiftyimob@gmail.com" className="text-primary hover:underline">enviar e-mail</a>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Política de Privacidade</p>
                        <Link to="/profile/privacy-policy" className="text-primary hover:underline">ler documento</Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Termos de Serviço</p>
                        <Link to="/profile/terms-of-service" className="text-primary hover:underline">ler documento</Link>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <p className="text-muted-foreground">Criado por</p>
                        <p className="font-medium">Leandro Antolini</p>
                    </div>
                </CardContent>
            </Card>
            <ConfirmationModal
                isOpen={showDeleteAccountConfirm}
                onClose={() => setShowDeleteAccountConfirm(false)}
                onConfirm={confirmDeleteAccount}
                title="Excluir Conta"
                message="Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos."
                isDestructive
                confirmText="Excluir Permanentemente"
            />
        </div>
    );
};

export default ProfilePage;
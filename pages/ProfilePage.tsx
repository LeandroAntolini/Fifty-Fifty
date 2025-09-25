import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { User as UserIcon, Edit2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user, updateProfile, loading: authLoading } = useAuth();
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

    useEffect(() => {
        if (user) {
            setFormData({
                Nome: user.corretorInfo.Nome,
                Telefone: user.corretorInfo.Telefone,
                Cidade: user.corretorInfo.Cidade,
                Estado: user.corretorInfo.Estado,
            });
            setAvatarPreview(user.corretorInfo.avatar_url || null);
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'Estado' ? value.toUpperCase() : value;
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
            await updateProfile(formData, avatarFile);
            toast.success('Perfil atualizado com sucesso!');
            setAvatarFile(null);
        } catch (err) {
            toast.error('Falha ao atualizar o perfil. Tente novamente.');
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
                            <Input id="Telefone" name="Telefone" value={formData.Telefone} onChange={handleChange} required />
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
        </div>
    );
};

export default ProfilePage;
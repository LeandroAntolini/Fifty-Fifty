import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Spinner from '../components/Spinner';

const ProfilePage: React.FC = () => {
    const { user, updateProfile, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        Nome: '',
        Telefone: '',
        Cidade: '',
        Estado: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                Nome: user.corretorInfo.Nome,
                Telefone: user.corretorInfo.Telefone,
                Cidade: user.corretorInfo.Cidade,
                Estado: user.corretorInfo.Estado,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'Estado' ? value.toUpperCase() : value;
        setFormData({ ...formData, [name]: finalValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            await updateProfile(formData);
            setMessage('Perfil atualizado com sucesso!');
        } catch (err) {
            setMessage('Falha ao atualizar o perfil. Tente novamente.');
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
                        {message && <p className={`p-3 rounded-md text-sm ${message.includes('sucesso') ? 'bg-accent/10 text-green-700' : 'bg-destructive/10 text-destructive'}`}>{message}</p>}
                        
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import toast from 'react-hot-toast';

const UpdateProfilePasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { updateUserPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setLoading(true);
        try {
            await updateUserPassword(password);
            toast.success('Senha atualizada com sucesso!');
            navigate('/profile');
        } catch (err) {
            toast.error((err as Error).message || 'Falha ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Atualizar Senha</CardTitle>
                    <CardDescription>Digite sua nova senha abaixo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdateProfilePasswordPage;
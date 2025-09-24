import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        Nome: '',
        CRECI: '',
        Telefone: '',
        Email: '',
        Cidade: '',
        Estado: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.CRECI) {
            setError("O CRECI é obrigatório.");
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError((err as Error).message || 'Falha ao registrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Criar Conta de Corretor</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</p>}
                        
                        <div className="space-y-1.5">
                            <Label htmlFor="Nome">Nome Completo</Label>
                            <Input id="Nome" name="Nome" placeholder="Seu nome completo" onChange={handleChange} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="CRECI">CRECI</Label>
                            <Input id="CRECI" name="CRECI" placeholder="CRECI (obrigatório)" onChange={handleChange} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="Email">Email</Label>
                            <Input id="Email" name="Email" type="email" placeholder="seu@email.com" onChange={handleChange} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" onChange={handleChange} required minLength={6} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="Telefone">Telefone / WhatsApp</Label>
                            <Input id="Telefone" name="Telefone" placeholder="(XX) XXXXX-XXXX" onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label htmlFor="Cidade">Cidade</Label>
                                <Input id="Cidade" name="Cidade" placeholder="Sua cidade" onChange={handleChange} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="Estado">Estado</Label>
                                <Input id="Estado" name="Estado" placeholder="UF" onChange={handleChange} required maxLength={2} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-center text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-bold text-primary hover:underline">
                            Faça Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
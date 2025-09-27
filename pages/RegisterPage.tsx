import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.CRECI) {
            toast.error("O CRECI é obrigatório.");
            return;
        }
        if (formData.password !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        setLoading(true);
        try {
            const result = await register(formData);
            if (result.needsConfirmation) {
                setRegistrationComplete(true);
            } else {
                navigate('/');
            }
        } catch (err) {
            toast.error((err as Error).message || 'Falha ao registrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (registrationComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-primary">Cadastro Realizado!</CardTitle>
                        <CardDescription>Verifique seu e-mail</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-dark">
                            Enviamos um link de confirmação para o seu e-mail. Por favor, clique no link para ativar sua conta antes de fazer o login.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link to="/login" className="w-full">
                            <Button className="w-full">Ir para Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Criar Conta de Corretor</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
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
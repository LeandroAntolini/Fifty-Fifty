import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        Nome: '',
        CRECI: '',
        Telefone: '',
        Email: '',
        Cidade: '',
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
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center text-primary mb-6">Criar Conta de Corretor</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}
                    
                    <input name="Nome" placeholder="Nome Completo" onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
                    <input name="CRECI" placeholder="CRECI (obrigatório)" onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
                    <input name="Email" type="email" placeholder="Email" onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
                    <input name="password" type="password" placeholder="Senha (mín. 6 caracteres)" onChange={handleChange} className="w-full px-3 py-2 border rounded" required minLength={6} />
                    <input name="Telefone" placeholder="Telefone / WhatsApp" onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
                    <input name="Cidade" placeholder="Cidade" onChange={handleChange} className="w-full px-3 py-2 border rounded" required />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-neutral-DEFAULT"
                    >
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                    <p className="text-center text-sm text-neutral-dark mt-4">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-bold text-primary hover:text-primary-hover">
                            Faça Login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
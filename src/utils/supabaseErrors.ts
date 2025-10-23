export const mapSupabaseError = (error: any): string => {
    if (!error) return 'Ocorreu um erro desconhecido.';

    const message = error.message || String(error);

    // Erros de Autenticação (Auth)
    if (message.includes('Invalid login credentials')) {
        return 'Credenciais de login inválidas.';
    }
    if (message.includes('Email not confirmed')) {
        return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam) para o link de confirmação.';
    }
    if (message.includes('User already registered')) {
        return 'Este e-mail já está cadastrado.';
    }
    if (message.includes('Password should be at least 6 characters')) {
        return 'A senha deve ter no mínimo 6 caracteres.';
    }
    
    // Erros de Banco de Dados (Postgres)
    if (message.includes('duplicate key value violates unique constraint')) {
        if (message.includes('corretores_username_key')) {
            return 'Nome de usuário já está em uso. Por favor, escolha outro.';
        }
        if (message.includes('corretores_creci_key')) {
            return 'CRECI já está cadastrado.';
        }
        return 'Dados duplicados. Verifique se o CRECI ou nome de usuário já existem.';
    }
    
    // Erros de Perfil (PGRST116 - No rows found)
    if (error.code === 'PGRST116') {
        return 'Seu perfil de corretor não foi encontrado. O cadastro pode não ter sido finalizado corretamente. Por favor, entre em contato com o suporte.';
    }

    // Erros Genéricos
    return message;
};
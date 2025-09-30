import React from 'react';

export const formatBRLNumber = (value: number): string => {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>): number => {
    let value = e.target.value;
    value = value.replace(/\D/g, ''); // remove non-digits
    if (value === '') return 0;
    return Number(value) / 100;
};
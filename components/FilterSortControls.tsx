import React, { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Filter, X, Plus } from 'lucide-react';
import { brazilianStates, citiesByState } from '../src/utils/brazilianLocations';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value' | 'archived';

interface FilterValues {
  cidade: string;
  bairro: string;
  estado: string;
  valorMin: string;
  valorMax: string;
  dormitorios: string;
}

interface FilterSortControlsProps {
  filters: FilterValues;
  onFilterChange: (filterName: keyof FilterValues, value: string) => void;
  sortCriteria: SortCriteria;
  onSortChange: (criteria: SortCriteria) => void;
  areFiltersActive: boolean;
  onClearFilters: () => void;
  placeholders: {
    cidade?: string; // Cidade e Estado não precisam mais de placeholder, mas mantemos para Bairro
    bairro: string;
    estado?: string;
  };
  onAddClick: () => void;
}

const sortOptions: { label: string; value: SortCriteria }[] = [
  { label: 'Recém Adicionados', value: 'newest' },
  { label: 'Mais Antigos', value: 'oldest' },
  { label: 'Maior Valor', value: 'highest_value' },
  { label: 'Menor Valor', value: 'lowest_value' },
  { label: 'Negociados', value: 'archived' },
];

const FilterSortControls: React.FC<FilterSortControlsProps> = ({
  filters,
  onFilterChange,
  sortCriteria,
  onSortChange,
  areFiltersActive,
  onClearFilters,
  placeholders,
  onAddClick,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const citiesForFilter = useMemo(() => {
    return filters.estado ? citiesByState[filters.estado] || [] : [];
  }, [filters.estado]);

  const handleStateChange = (stateAbbr: string) => {
    onFilterChange('estado', stateAbbr);
    onFilterChange('cidade', ''); // Limpa a cidade ao mudar o estado
  };

  return (
    <div className="bg-white p-2 rounded-lg shadow mb-4 space-y-2">
      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex-1 justify-center">
          <Filter size={16} className="mr-2" />
          Filtrar
          {areFiltersActive && <span className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
        </Button>
        <div className="flex-1">
            <Select value={sortCriteria} onValueChange={(value) => onSortChange(value as SortCriteria)}>
                <SelectTrigger>
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button onClick={onAddClick} className="w-10 h-10 p-0 flex-shrink-0">
          <Plus size={24} />
        </Button>
      </div>
      {showFilters && (
        <div className="p-2 border-t">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Estado Select */}
            <Select name="estado" value={filters.estado} onValueChange={handleStateChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Estado (UF)" />
                </SelectTrigger>
                <SelectContent>
                    {brazilianStates.map(state => (
                        <SelectItem key={state.sigla} value={state.sigla}>{state.sigla}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            {/* Cidade Select */}
            <Select name="cidade" value={filters.cidade} onValueChange={(value) => onFilterChange('cidade', value)} disabled={!filters.estado}>
                <SelectTrigger>
                    <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                    {citiesForFilter.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Bairro Input */}
            <Input type="text" placeholder={placeholders.bairro} value={filters.bairro} onChange={(e) => onFilterChange('bairro', e.target.value)} />
            
            {/* Dormitórios Input */}
            <Input type="number" placeholder="Dorms. Mín." value={filters.dormitorios} onChange={(e) => onFilterChange('dormitorios', e.target.value)} />
            
            {/* Valor Min Input */}
            <Input type="number" placeholder="Valor Mín." value={filters.valorMin} onChange={(e) => onFilterChange('valorMin', e.target.value)} />
            
            {/* Valor Max Input */}
            <Input type="number" placeholder="Valor Máx." value={filters.valorMax} onChange={(e) => onFilterChange('valorMax', e.target.value)} />
          </div>
          <Button variant="ghost" onClick={onClearFilters} className="w-full text-destructive">
            <X size={16} className="mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterSortControls;
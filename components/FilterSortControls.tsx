import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Filter, X } from 'lucide-react';

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
    cidade: string;
    bairro: string;
  };
}

const sortOptions: { label: string; value: SortCriteria }[] = [
  { label: 'Recém Adicionados', value: 'newest' },
  { label: 'Mais Antigos', value: 'oldest' },
  { label: 'Maior Valor', value: 'highest_value' },
  { label: 'Menor Valor', value: 'lowest_value' },
  { label: 'Arquivados', value: 'archived' },
];

const FilterSortControls: React.FC<FilterSortControlsProps> = ({
  filters,
  onFilterChange,
  sortCriteria,
  onSortChange,
  areFiltersActive,
  onClearFilters,
  placeholders,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white p-2 rounded-lg shadow mb-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-center">
          <Filter size={16} className="mr-2" />
          Filtrar
          {areFiltersActive && <span className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
        </Button>
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
      {showFilters && (
        <div className="p-2 border-t">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input type="text" placeholder={placeholders.cidade} value={filters.cidade} onChange={(e) => onFilterChange('cidade', e.target.value)} />
            <Input type="text" placeholder={placeholders.bairro} value={filters.bairro} onChange={(e) => onFilterChange('bairro', e.target.value)} />
            <Input type="text" placeholder="Estado (UF)" value={filters.estado} onChange={(e) => onFilterChange('estado', e.target.value.toUpperCase())} maxLength={2} />
            <Input type="number" placeholder="Dorms. Mín." value={filters.dormitorios} onChange={(e) => onFilterChange('dormitorios', e.target.value)} />
            <Input type="number" placeholder="Valor Mín." value={filters.valorMin} onChange={(e) => onFilterChange('valorMin', e.target.value)} />
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
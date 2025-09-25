import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Filter, ArrowUpDown, X } from 'lucide-react';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value';

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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-2 rounded-lg shadow mb-4 space-y-2">
      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-center">
          <Filter size={16} className="mr-2" />
          Filtrar
          {areFiltersActive && <span className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
        </Button>
        <div className="relative w-full" ref={sortMenuRef}>
          <Button variant="outline" onClick={() => setShowSortMenu(!showSortMenu)} className="w-full justify-center">
            <ArrowUpDown size={16} className="mr-2" />
            Ordenar
          </Button>
          {showSortMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => { onSortChange(option.value); setShowSortMenu(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm ${sortCriteria === option.value ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {showFilters && (
        <div className="p-2 border-t">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder={placeholders.cidade} value={filters.cidade} onChange={(e) => onFilterChange('cidade', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder={placeholders.bairro} value={filters.bairro} onChange={(e) => onFilterChange('bairro', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder="Estado (UF)" value={filters.estado} onChange={(e) => onFilterChange('estado', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded text-sm" maxLength={2} />
            <input type="number" placeholder="Dorms. Mín." value={filters.dormitorios} onChange={(e) => onFilterChange('dormitorios', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="number" placeholder="Valor Mín." value={filters.valorMin} onChange={(e) => onFilterChange('valorMin', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="number" placeholder="Valor Máx." value={filters.valorMax} onChange={(e) => onFilterChange('valorMax', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
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
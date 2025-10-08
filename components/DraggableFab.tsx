import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { cn } from '../lib/utils';

interface DraggableFabProps {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

const HEADER_HEIGHT = 64; // Altura aproximada do cabeçalho
const BOTTOM_NAV_HEIGHT = 56; // Altura aproximada da barra de navegação inferior

const DraggableFab: React.FC<DraggableFabProps> = ({ onClick, ariaLabel, children, className }) => {
  const fabRef = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | null>(null); // Posição 'top' gerenciada
  const [isDraggingState, setIsDraggingState] = useState(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);
  const isClickRef = useRef(true); // Para diferenciar clique de arrastar

  // Define a posição inicial do FAB ao montar o componente
  useEffect(() => {
    if (fabRef.current && top === null) {
      const viewportHeight = window.innerHeight;
      const fabHeight = fabRef.current.offsetHeight;
      // Posição inicial: bottom-18, então top é viewportHeight - 18 - fabHeight
      const initialTop = viewportHeight - 18 - fabHeight;
      setTop(initialTop);
    }
  }, [top]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isClickRef.current = true;
    setIsDraggingState(true);
    startYRef.current = e.clientY;
    startTopRef.current = top!; // Usa a posição 'top' atual
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingState) return;
    isClickRef.current = false; // Se o mouse se move, é um arrasto

    const deltaY = e.clientY - startYRef.current;
    let newTop = startTopRef.current + deltaY;

    const viewportHeight = window.innerHeight;
    const fabHeight = fabRef.current?.offsetHeight || 56; // Altura padrão se não renderizado

    // Define os limites de arrasto
    const minTop = HEADER_HEIGHT;
    const maxTop = viewportHeight - BOTTOM_NAV_HEIGHT - fabHeight;

    newTop = Math.max(minTop, Math.min(newTop, maxTop));
    setTop(newTop);
  }, [isDraggingState, top]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingState(false);
  }, []);

  // Adiciona e remove listeners de eventos globais para arrastar
  useEffect(() => {
    if (isDraggingState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingState, handleMouseMove, handleMouseUp]);

  const handleClick = () => {
    if (isClickRef.current) {
      onClick();
    }
  };

  if (top === null) return null; // Não renderiza até que a posição inicial seja calculada

  return (
    <button
      ref={fabRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={cn(
        "fixed right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-light z-20 cursor-grab active:cursor-grabbing",
        className
      )}
      style={{ top: `${top}px` }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default DraggableFab;
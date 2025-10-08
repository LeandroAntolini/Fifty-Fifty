import React, { useState, useRef, useEffect, useLayoutEffect, ReactNode, useCallback } from 'react';
import { cn } from '../lib/utils';

interface DraggableFabProps {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

const HEADER_HEIGHT = 64; // Altura aproximada do cabeçalho
const BOTTOM_NAV_HEIGHT = 56; // Altura aproximada da barra de navegação inferior (h-14 = 56px)
const FAB_SIZE = 56; // w-14 h-14 = 56px

const DraggableFab: React.FC<DraggableFabProps> = ({ onClick, ariaLabel, children, className }) => {
  const fabRef = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);
  const isClickRef = useRef(true);

  useLayoutEffect(() => {
    if (fabRef.current && top === null) {
      const viewportHeight = window.innerHeight;
      // Position 18px above the bottom navigation bar
      const initialTop = viewportHeight - BOTTOM_NAV_HEIGHT - FAB_SIZE - 18;
      setTop(initialTop);
    }
  }, [top]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isClickRef.current = true;
    setIsDraggingState(true);
    startYRef.current = e.clientY;
    startTopRef.current = top!;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingState) return;
    isClickRef.current = false;

    const deltaY = e.clientY - startYRef.current;
    let newTop = startTopRef.current + deltaY;

    const viewportHeight = window.innerHeight;

    // Define the dragging limits
    const minTop = HEADER_HEIGHT; // Cannot go above the header
    const maxTop = viewportHeight - BOTTOM_NAV_HEIGHT - FAB_SIZE - 18; // Cannot go below the bottom nav + 18px margin

    newTop = Math.max(minTop, Math.min(newTop, maxTop));
    setTop(newTop);
  }, [isDraggingState, top]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingState(false);
  }, []);

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

  if (top === null) return null;

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
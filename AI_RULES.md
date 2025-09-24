# AI Rules for Fifty-Fifty: Parcerias Imobiliárias

This document outlines the core technologies used in this application and provides guidelines for their usage.

## Tech Stack

*   **Frontend Framework**: React with TypeScript for building dynamic user interfaces.
*   **Routing**: React Router (`react-router-dom`) for client-side navigation and managing application routes.
*   **Styling**: Tailwind CSS for all styling, ensuring a utility-first approach and responsive design.
*   **UI Components**: Shadcn/ui for accessible and customizable UI components.
*   **Icons**: Lucide React for a consistent set of vector icons.
*   **State Management**: React Context API for managing global application state, such as authentication and UI modals.
*   **Build Tool**: Vite for a fast development experience and optimized builds.
*   **Language**: TypeScript for type safety and improved code quality.
*   **API Interaction**: A custom `services/api.ts` layer to abstract backend communication.

## Library Usage Rules

*   **React**: Always use React for creating components and managing component-level state.
*   **React Router**: All client-side navigation must be handled using `react-router-dom`. Keep routes defined in `src/App.tsx`.
*   **Tailwind CSS**: Apply all styling using Tailwind CSS utility classes. Avoid inline styles or separate CSS files unless absolutely necessary for very specific, non-Tailwind-compatible cases.
*   **Shadcn/ui**: When needing common UI elements (buttons, inputs, modals, etc.), prioritize using or adapting components from the shadcn/ui library. If modifications are needed, create a new component that wraps or extends the shadcn/ui component rather than editing the original library files.
*   **Lucide React**: Use icons from the `lucide-react` package.
*   **Context API**: For application-wide state (e.g., user authentication, global UI state like modal visibility), use React's Context API.
*   **API Service (`services/api.ts`)**: All interactions with the backend (fetching, creating, updating, deleting data) must go through the functions defined in `src/services/api.ts`. Do not make direct API calls from components or hooks.
*   **File Structure**:
    *   Pages should be in `src/pages/`.
    *   Reusable components should be in `src/components/`.
    *   Hooks should be in `src/hooks/`.
    *   Contexts should be in `src/contexts/`.
    *   Utility functions should be in `src/utils/`.
    *   All directory names must be lowercase.
*   **New Components**: Always create a new file for every new component or hook, no matter how small. Avoid adding new components to existing files.
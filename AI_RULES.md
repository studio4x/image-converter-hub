# AI Rules for this Project

This document outlines the core technologies used in this project and provides guidelines for library usage to maintain consistency and best practices.

## Tech Stack Description

*   **Frontend Framework**: React.js for building dynamic user interfaces.
*   **Language**: TypeScript for type-safe code, enhancing maintainability and catching errors early.
*   **Build Tool**: Vite for a fast development experience and optimized builds.
*   **Styling**: Tailwind CSS for utility-first styling, enabling rapid and consistent UI development.
*   **UI Components**: shadcn/ui, a collection of beautifully designed and accessible components built on Radix UI and styled with Tailwind CSS.
*   **Routing**: React Router for declarative navigation and routing within the single-page application.
*   **Data Fetching & State Management**: React Query (`@tanstack/react-query`) for managing server state, caching, and asynchronous data operations.
*   **Icons**: Lucide React for a comprehensive and customizable icon set.
*   **Form Handling**: React Hook Form for efficient and flexible form management, often paired with Zod for schema validation.
*   **Animations**: Framer Motion for declarative and performant animations.

## Library Usage Rules

To ensure consistency and maintainability, please adhere to the following rules when developing:

*   **UI Components**:
    *   **Always** prioritize using components from `shadcn/ui` (located in `src/components/ui`).
    *   If a required component is not available in `shadcn/ui`, create a new, custom component in `src/components/` and style it exclusively with Tailwind CSS.
    *   **Never** modify existing `shadcn/ui` component files directly.
*   **Styling**:
    *   **Exclusively** use Tailwind CSS classes for all component styling. Avoid inline styles or separate CSS modules for individual components.
    *   Global styles and Tailwind configuration are managed in `src/index.css` and `tailwind.config.ts` respectively.
*   **Routing**:
    *   Use `react-router-dom` for all application navigation.
    *   Define all main application routes within `src/App.tsx`.
*   **State Management**:
    *   For server-side data fetching, caching, and complex asynchronous operations, use `@tanstack/react-query`.
    *   For simple, local component state, use React's built-in `useState` and `useReducer` hooks.
*   **Forms**:
    *   Implement all forms using `react-hook-form` for robust validation and state management.
    *   For schema validation, use `zod` in conjunction with `react-hook-form` resolvers.
*   **Icons**:
    *   All icons should be imported and used from the `lucide-react` library.
*   **Toasts/Notifications**:
    *   Use the `toast` utility provided by `src/hooks/use-toast.ts` (which leverages `shadcn/ui`'s `Toast` component) for general user notifications.
    *   The `sonner` library is also available for more advanced or different styles of toast notifications if specifically required.
*   **Animations**:
    *   Utilize `framer-motion` for any animations within the application.
*   **Utility Functions**:
    *   Place general utility functions (e.g., helper functions for `cn`) in `src/lib/utils.ts`.
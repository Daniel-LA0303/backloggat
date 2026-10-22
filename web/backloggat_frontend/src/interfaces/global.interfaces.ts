import type { UIButtonSize, UIButtonVariant } from "../types/global.components";

export interface UIButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    children: React.ReactNode;
    /** Tema actual, lo decide el padre */
    //dark: boolean;
    variant?: UIButtonVariant;
    size?: UIButtonSize;
    fullWidth?: boolean;
    /** Muestra un spinner y bloquea el click */
    loading?: boolean;
    /** Icono opcional a la izquierda / derecha del texto */
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
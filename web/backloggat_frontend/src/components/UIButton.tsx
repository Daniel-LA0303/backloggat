import { forwardRef } from 'react'
import type { UIButtonSize, UIButtonVariant } from '../types/global.components';
import type { UIButtonProps } from '../interfaces/global.interfaces';


const VARIANTS: Record<UIButtonVariant, string> = {
    // 1 · Principal: negro en claro, blanco en oscuro
    primary: 'glass-btn text-white rounded-xl',
    // 2 · Contraste
    secondary: `
    text-white rounded-xl
    bg-[#121c17]/35 backdrop-blur-xl backdrop-saturate-150
    border border-[#96bea8]/20
    transition-colors duration-200
    hover:bg-[#121c17]/55 hover:border-[#96bea8]/35
    active:bg-[#0a100d]/70 active:translate-y-px
    focus-visible:ring-2 focus-visible:ring-[#96bea8]/40 focus-visible:ring-offset-2
`,
    // 3 · Azul (acento)
    accent: 'bg-blue-600 text-white border-transparent shadow-sm shadow-blue-600/30 hover:bg-blue-500 focus-visible:ring-blue-400 focus-visible:ring-offset-white',
    // 4 · Fantasma (fondo transparente)
    ghost: 'bg-transparent text-neutral-900 border-transparent hover:bg-neutral-900/5 focus-visible:ring-neutral-400 focus-visible:ring-offset-white',
    danger: 'bg-red-600 text-white border-transparent shadow-sm shadow-red-600/30 hover:bg-red-500 focus-visible:ring-red-400 focus-visible:ring-offset-white',

};

const SIZES: Record<UIButtonSize, string> = {
    small: 'h-8 w-fit px-4 text-[13px] gap-1.5',
    medium: 'h-10 w-fit px-6 text-sm gap-2',
    large: 'h-11 w-fit px-8 text-base gap-2.5',
};

const BASE =
    'inline-flex cursor-pointer items-center justify-center rounded-lg border font-medium leading-none whitespace-nowrap select-none ' +
    'transition-all duration-300 active:scale-[0.98] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100';

const Spinner = () => (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

const UIButton = forwardRef<HTMLButtonElement, UIButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'small',
            fullWidth = false,
            loading = false,
            leftIcon,
            rightIcon,
            disabled,
            type = 'button',
            className = '',
            ...rest
        }, ref,) => {

        const styles = VARIANTS[variant];
        const isDisabled = disabled || loading;


        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                aria-busy={loading || undefined}
                className={[BASE, SIZES[size], styles, fullWidth ? 'w-full' : '', className]
                    .filter(Boolean)
                    .join(' ')}
                {...rest}
            >
                {loading ? <Spinner /> : leftIcon}
                {children}
                {!loading && rightIcon}
            </button>
        )
    }
);

UIButton.displayName = 'UIButton';

export default UIButton
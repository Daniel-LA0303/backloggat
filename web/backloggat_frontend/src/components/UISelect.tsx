import {
    Children,
    isValidElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
} from 'react';

type UISelectSize = 'small' | 'medium' | 'large';

type OptionProps = {
    value: string;
    children: ReactNode;
    disabled?: boolean;
};

/** Declarative option. A plain <option> works too. */
export function UIOption(_props: OptionProps) {
    return null;
}

type UISelectProps = {
    children: ReactNode;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    size?: UISelectSize;
    disabled?: boolean;
    name?: string;
    /** Replaces the default root class ("w-full"), e.g. className="w-56" */
    className?: string;
};

const SIZES: Record<UISelectSize, string> = {
    small: 'h-8 px-3.5 text-[13px]',
    medium: 'h-10 px-4 text-sm',
    large: 'h-11 px-5 text-base',
};

export function UISelect({
    children,
    value,
    defaultValue = '',
    onChange,
    placeholder = 'Select...',
    size = 'medium',
    disabled = false,
    name,
    className = 'w-full',
}: UISelectProps) {
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [inner, setInner] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    const current = value ?? inner;

    const options = useMemo(
        () =>
            Children.toArray(children)
                .filter(isValidElement)
                .map((child) => {
                    const p = (child as ReactElement<OptionProps>).props;
                    return {
                        value: String(p.value),
                        label: p.children,
                        disabled: !!p.disabled,
                    };
                }),
        [children],
    );

    const selectedIndex = options.findIndex((o) => o.value === current);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

    const firstEnabled = () => options.findIndex((o) => !o.disabled);

    // reset highlighted row each time the list opens
    useEffect(() => {
        if (open) setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // keep highlighted row visible
    useEffect(() => {
        if (!open || active < 0) return;
        listRef.current
            ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [active, open]);

    // click outside closes
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const choose = (index: number) => {
        const opt = options[index];
        if (!opt || opt.disabled) return;
        if (value === undefined) setInner(opt.value);
        onChange?.(opt.value);
        setOpen(false);
    };

    const move = (dir: 1 | -1) => {
        if (!options.length) return;
        let i = active;
        for (let n = 0; n < options.length; n++) {
            i = (i + dir + options.length) % options.length;
            if (!options[i].disabled) {
                setActive(i);
                return;
            }
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                e.preventDefault();
                if (!open) setOpen(true);
                else move(e.key === 'ArrowDown' ? 1 : -1);
                break;
            case 'Home':
                if (open) {
                    e.preventDefault();
                    setActive(firstEnabled());
                }
                break;
            case 'End':
                if (open) {
                    e.preventDefault();
                    const last = [...options].reverse().findIndex((o) => !o.disabled);
                    setActive(last < 0 ? -1 : options.length - 1 - last);
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!open) setOpen(true);
                else choose(active);
                break;
            case 'Escape':
                setOpen(false);
                break;
            case 'Tab':
                setOpen(false);
                break;
        }
    };

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {name && <input type="hidden" name={name} value={current} />}

            <button
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${id}-list`}
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={onKeyDown}
                className={`
                    flex w-full items-center justify-between gap-2
                    rounded-xl border text-left text-white
                    backdrop-blur-xl backdrop-saturate-150
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_2px_6px_rgba(0,0,0,0.25)]
                    transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96bea8]/20
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${SIZES[size]}
                    ${
                        open
                            ? 'border-[#96bea8]/60 bg-[#0a100d]/75'
                            : 'border-[#96bea8]/25 bg-[#121c17]/55 hover:border-[#96bea8]/40'
                    }
                `}
            >
                <span className={`truncate ${selected ? '' : 'text-white/35'}`}>
                    {selected ? selected.label : placeholder}
                </span>

                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 shrink-0 text-[#9fd0b4] transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                    }`}
                >
                    <path d="M5 8l5 5 5-5" />
                </svg>
            </button>

            <ul
                ref={listRef}
                id={`${id}-list`}
                role="listbox"
                className={`
                    absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-auto
                    rounded-xl border border-[#96bea8]/25 p-1.5
                    bg-[#0e1612]/85 backdrop-blur-xl backdrop-saturate-150
                    shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]
                    origin-top transition duration-150
                    ${
                        open
                            ? 'translate-y-0 scale-100 opacity-100'
                            : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                    }
                `}
            >
                {options.map((opt, i) => {
                    const isSelected = i === selectedIndex;
                    const isActive = i === active;
                    return (
                        <li
                            key={opt.value}
                            role="option"
                            data-index={i}
                            aria-selected={isSelected}
                            aria-disabled={opt.disabled}
                            onMouseEnter={() => !opt.disabled && setActive(i)}
                            onClick={() => choose(i)}
                            className={`
                                flex select-none items-center justify-between gap-2
                                rounded-lg px-3 py-2 text-[13px] transition-colors
                                ${opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                                ${isActive && !opt.disabled ? 'bg-[#96bea8]/15' : ''}
                                ${isSelected ? 'text-[#b9e2cb]' : 'text-white/75'}
                            `}
                        >
                            <span className="truncate">{opt.label}</span>
                            {isSelected && (
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 shrink-0"
                                >
                                    <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                                </svg>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

UISelect.Option = UIOption;
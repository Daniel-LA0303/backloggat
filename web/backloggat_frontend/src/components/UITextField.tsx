import React, { useState } from 'react'

const UITextField = ({
    label,
    value,
    onChange,
    placeholder,
    multiline,
    rows,
    disabled,
    startAdornment,
    mono,
    type
}: {
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<any>) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    startAdornment?: React.ReactNode;
    mono?: boolean
    type?: string
}) => {

    const [focused, setFocused] = useState<boolean>(false);
    //const borderColor = focused ? '#2563EB' : 'rgba(0,0,0,0.12)';

    const Tag: any = multiline ? 'textarea' : 'input';


    return (
        <div className='flex flex-col gap-1 mb-1'>

            {label && (
                <label
                    className={`text-[13px] mb-3 ${focused ? 'text-white' : 'text-white/70'}`}
                >
                    {label}
                </label>
            )}

            <div className={`
                flex gap-2 rounded-[10px]
                ${multiline ? 'items-start' : 'items-center'}
                ${startAdornment ? 'px-2' : 'px-3'}
                ${disabled ? 'bg-black/90' : 'bg-black/20'}
                ${focused ? 'border border-solid' : 'border-[0.5px] border-solid'}
                transition-colors duration-150 
                `}
            >
                {startAdornment}
                <Tag
                    value={value}
                    type={type && type}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={multiline ? (rows ?? 2) : undefined}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        flex-1 min-w-0 w-full
                        border-none outline-none bg-transparent
                        placeholder:text-white/35 caret-[#9fd0b4] 
                        ${mono ? 'text-xs font-mono' : 'text-[13px]'}
                        py-3
                        ${multiline ? 'resize-none' : ''}
                        ${disabled ? 'text-white/45' : 'text-white'}
                    `}
                />
            </div>
        </div>
    )
}

export default UITextField
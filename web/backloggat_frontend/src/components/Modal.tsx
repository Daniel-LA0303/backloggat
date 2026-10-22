import React from 'react'
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from '../utils/iconsUtils';

const Modal = ({
    open,
    onClose,
    children,
    className,
    title
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode
    className?: string
    title?: string
}) => createPortal(
    <AnimatePresence>
        {open && (
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
                className="fixed flex inset-0 z-50 bg-[#00000073] backdrop-blur-lg items-center justify-center p-3 md:p-16"
            >
                <motion.div
                    key="panel"
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 12 }}
                    transition={{ duration: 0.18, type: 'spring', stiffness: 400, damping: 28 }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className={`rise h-8/12 overflow-y-auto glass-scroll glass glass-hi corners backdrop-blur-md overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] ${className}`}
                >
                    <div className='flex sticky top-0 z-10 w-full justify-between'>
                        <p className='mt-5 ml-3 font-bold text-2xl'>{title && title}</p>
                        <button
                            className='p-3 text-2xl cursor-pointer'
                            onClick={onClose}
                        >
                            <CloseIcon
                                size={20}
                            />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>,
    document.body
)

export default Modal
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm deve ser usado dentro de um ConfirmProvider");
  }
  return context.confirm;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    if (resolvePromise) resolvePromise(true);
    handleClose();
  };

  const handleCancel = () => {
    if (resolvePromise) resolvePromise(false);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setOptions(null);
      setResolvePromise(null);
    }, 200); // aguarda a animação terminar
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop Blur Clássico Dark Platinum */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#161617] border border-white/[0.08] rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Glossy top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl border ${
                    options.isDestructive !== false
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  }`}
                >
                  <AlertTriangle size={24} strokeWidth={1.5} />
                </div>
                
                <div className="flex-1 mt-1">
                  <h3 className="text-xl font-semibold text-white tracking-tight mb-2">
                    {options.title}
                  </h3>
                  {options.message && (
                    <p className="text-sm text-[#86868b] leading-relaxed">
                      {options.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-full font-medium text-sm text-[#f5f5f7] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] transition-colors"
                >
                  {options.cancelText || "Cancelar"}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${
                    options.isDestructive !== false
                      ? "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                      : "bg-[#0071e3] hover:bg-[#0077ED] shadow-[#0071e3]/20"
                  }`}
                >
                  {options.confirmText || "Confirmar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

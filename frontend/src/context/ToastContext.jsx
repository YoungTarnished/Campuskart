import { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useMemo(() => (message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3600)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-card ${
              item.tone === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

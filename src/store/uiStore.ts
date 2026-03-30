import { create } from 'zustand'

export interface ToastItem {
  id: string
  title: string
  variant: 'success' | 'error' | 'info'
}

interface UiState {
  exportDialogOpen: boolean
  toasts: ToastItem[]
}

interface UiActions {
  setExportDialogOpen: (open: boolean) => void
  pushToast: (toast: ToastItem) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  exportDialogOpen: false,
  toasts: [],
  setExportDialogOpen: (exportDialogOpen) => set({ exportDialogOpen }),
  pushToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

import { create } from "zustand";

interface SelectionState {
  selectedArchiveId: string | null;
  selectedArchiveInfo: {
    code?: string;
    name?: string;
    company?: string;
  };

  selectArchive: (
    id: string,
    info?: { code?: string; name?: string; company?: string }
  ) => void;
  clearSelection: () => void;
}



export const useArchiveStore = create<SelectionState>((set) => ({
  selectedArchiveId: null,
  selectedArchiveInfo: {},
  selectArchive: (id, info = {}) =>
    set({ selectedArchiveId: id, selectedArchiveInfo: info }),
  clearSelection: () =>
    set({ selectedArchiveId: null, selectedArchiveInfo: {} }),
}));
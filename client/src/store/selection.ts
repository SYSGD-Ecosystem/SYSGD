// src/store/selection.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectionState {
	selectedProjectId: string | null;
	selectedArchiveId: string | null;
	setProjectId: (id: string) => void;
	clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()(
	persist(
		(set) => ({
			selectedProjectId: null,
			selectedArchiveId: null,
			setProjectId: (id) => set({ selectedProjectId: id }),
			clearSelection: () =>
				set({ selectedProjectId: null, selectedArchiveId: null }),
		}),
		{
			name: "selection-storage-project", // clave de localStorage
		},
	),
);

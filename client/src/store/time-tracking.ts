import { create } from "zustand";
import api from "@/lib/api";
import type { TimeEntry } from "@/types/TimeEntry";

type StartEntryPayload = {
	project_id?: string | null;
	task_id?: string | null;
	description?: string | null;
};

type TimeTrackingState = {
	activeEntry: TimeEntry | null;
	loading: boolean;
	now: number;
	setNow: (now: number) => void;
	fetchActiveEntry: () => Promise<TimeEntry | null>;
	startEntry: (payload: StartEntryPayload) => Promise<TimeEntry | null>;
	pauseEntry: (entryId: string) => Promise<TimeEntry | null>;
	resumeEntry: (entryId: string) => Promise<TimeEntry | null>;
	stopEntry: (entryId: string) => Promise<TimeEntry | null>;
};

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
	activeEntry: null,
	loading: false,
	now: Date.now(),
	setNow: (now) => set({ now }),
	fetchActiveEntry: async () => {
		try {
			set({ loading: true });
			const response = await api.get<TimeEntry[]>(
				"/api/time-entries?active=true",
			);
			const entry = response.data[0] ?? null;
			set({ activeEntry: entry ?? null });
			return entry ?? null;
		} catch (error) {
			console.error("Error al obtener cronómetro activo:", error);
			set({ activeEntry: null });
			return null;
		} finally {
			set({ loading: false });
		}
	},
	startEntry: async (payload) => {
		try {
			set({ loading: true });
			const response = await api.post<TimeEntry>(
				"/api/time-entries/start",
				payload,
			);
			set({ activeEntry: response.data });
			const refreshed = await get().fetchActiveEntry();
			return refreshed ?? response.data;
		} catch (error) {
			console.error("Error al iniciar cronómetro:", error);
			return null;
		} finally {
			set({ loading: false });
		}
	},
	pauseEntry: async (entryId) => {
		try {
			set({ loading: true });
			const response = await api.put<TimeEntry>(
				`/api/time-entries/${entryId}/pause`,
			);
			set({ activeEntry: response.data });
			const refreshed = await get().fetchActiveEntry();
			return refreshed ?? response.data;
		} catch (error) {
			console.error("Error al pausar cronómetro:", error);
			return null;
		} finally {
			set({ loading: false });
		}
	},
	resumeEntry: async (entryId) => {
		try {
			set({ loading: true });
			const response = await api.put<TimeEntry>(
				`/api/time-entries/${entryId}/resume`,
			);
			set({ activeEntry: response.data });
			const refreshed = await get().fetchActiveEntry();
			return refreshed ?? response.data;
		} catch (error) {
			console.error("Error al reanudar cronómetro:", error);
			return null;
		} finally {
			set({ loading: false });
		}
	},
	stopEntry: async (entryId) => {
		try {
			set({ loading: true });
			const response = await api.put<TimeEntry>(
				`/api/time-entries/${entryId}/stop`,
			);
			set({ activeEntry: null });
			await get().fetchActiveEntry();
			return response.data;
		} catch (error) {
			console.error("Error al detener cronómetro:", error);
			return null;
		} finally {
			set({ loading: false });
		}
	},
}));

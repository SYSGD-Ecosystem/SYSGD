export type AnomalySeverity = "low" | "medium" | "high"

export interface MultiDeviceSignal {
	user_id: string
	name: string | null
	email: string
	user_agents: number
	ips: number
	active_sessions: number
	last_login: string | null
	severity: AnomalySeverity
}

export interface SharedAccountSignal {
	type: "shared_device" | "multi_identity"
	ip: string | null
	user_agent: string | null
	account_count: number
	emails: string[]
	user_id: string | null
	name: string | null
	last_login: string | null
	severity: AnomalySeverity
}

export interface AnomalyReport {
	generatedAt: string
	windows: { multiDeviceDays: number; sharedDays: number }
	multiDevice: MultiDeviceSignal[]
	sharedAccounts: SharedAccountSignal[]
}

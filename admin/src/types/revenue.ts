export interface RevenueMonth {
	/** Formato YYYY-MM */
	month: string
	revenue: number
	orders: number
	buyers: number
}

export interface MonthlyRevenue {
	months: number
	series: RevenueMonth[]
	kpis: {
		currentMonth: number
		previousMonth: number
		total: number
		orders: number
		avgTicket: number
	}
}

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { LoanRegisterData } from "@/types/LoanRegister";


interface LoanResponse {
    loan_register: LoanRegisterData[];
    [key: string]: any;
}

const useGetLoanRegister = (entryId: string) => {
    // Inicializamos como array vacío para mantener compatibilidad con la UI
    const [loan, setLoan] = useState<LoanResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!entryId) {
            setLoan([]);
            setLoading(false);
            return;
        }

        const fetchLoan = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<LoanResponse[]>("/api/get-document-loan", {
                    params: { id: entryId }
                });

                setLoan(response.data || []);
            } catch (err: any) {
                console.error("Error en useGetLoanRegister:", err);
                setError(
                    err.response?.data?.message || 
                    "Error al obtener el registro de préstamo"
                );
                setLoan([]); // Seguridad ante fallos de red
            } finally {
                setLoading(false);
            }
        };

        fetchLoan();
    }, [entryId]);

    return { loan, error, loading };
};

export default useGetLoanRegister;
import { useState, useEffect, useCallback } from "react";
import { reportsApi, ReportSummary, LowStockProduct, TransactionSummary, TransactionDetail } from "../lib/api/reports";

export type ReportPeriod = "today" | "week" | "month" | "all";

export const useReports = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [txSummary, setTxSummary] = useState<TransactionSummary[]>([]);
  const [txDetails, setTxDetails] = useState<TransactionDetail[]>([]);
  
  const [period, setPeriod] = useState<ReportPeriod>("month");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // getSummary and getLowStock don't use period filtering currently (they represent current state)
      const [sumData, lowData, txSumData, txDetData] = await Promise.all([
        reportsApi.getSummary(),
        reportsApi.getLowStock(),
        reportsApi.getTransactionsSummary(period),
        reportsApi.getTransactionsDetail(period),
      ]);
      setSummary(sumData);
      setLowStock(lowData);
      setTxSummary(txSumData);
      setTxDetails(txDetData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { 
    summary, 
    lowStock, 
    txSummary, 
    txDetails,
    period,
    setPeriod,
    isLoading, 
    error, 
    refetch: fetchReports 
  };
};

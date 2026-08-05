import { useState, useEffect, useCallback } from "react";
import { reportsApi, ReportSummary, LowStockProduct, TransactionSummary, TransactionDetail } from "../lib/api/reports";

export type ReportPeriod = "Day" | "Week" | "Month";

// Helper functions for default values
const getTodayString = () => new Date().toISOString().split("T")[0];
const getThisMonthString = () => new Date().toISOString().slice(0, 7);
const getThisWeekString = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export const useReports = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [txSummary, setTxSummary] = useState<TransactionSummary[]>([]);
  const [txDetails, setTxDetails] = useState<TransactionDetail[]>([]);
  
  const [period, setPeriod] = useState<ReportPeriod>("Month");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedWeek, setSelectedWeek] = useState<string>(getThisWeekString());
  const [selectedMonth, setSelectedMonth] = useState<string>(getThisMonthString());
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculate dates based on selected period
      let startDate = "";
      let endDate = "";
      
      if (period === "Day" && selectedDate) {
        startDate = selectedDate;
        endDate = selectedDate;
      } else if (period === "Month" && selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay}`;
      } else if (period === "Week" && selectedWeek) {
        const [yearStr, weekStr] = selectedWeek.split("-W");
        if (yearStr && weekStr) {
          const year = Number(yearStr);
          const week = Number(weekStr);
          const simple = new Date(year, 0, 1 + (week - 1) * 7);
          const dow = simple.getDay();
          const ISOweekStart = simple;
          if (dow <= 4)
              ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
          else
              ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
          
          startDate = ISOweekStart.toISOString().split("T")[0];
          const ISOweekEnd = new Date(ISOweekStart);
          ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
          endDate = ISOweekEnd.toISOString().split("T")[0];
        }
      }

      const [sumData, lowData, txSumData, txDetData] = await Promise.all([
        reportsApi.getSummary(),
        reportsApi.getLowStock(),
        reportsApi.getTransactionsSummary("custom", startDate, endDate),
        reportsApi.getTransactionsDetail("custom", startDate, endDate),
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
  }, [period, selectedDate, selectedWeek, selectedMonth]);

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
    selectedDate,
    setSelectedDate,
    selectedWeek,
    setSelectedWeek,
    selectedMonth,
    setSelectedMonth,
    isLoading, 
    error, 
    refetch: fetchReports 
  };
};

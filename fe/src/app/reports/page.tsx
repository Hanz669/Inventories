"use client";

import React from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { useReports, ReportPeriod } from "../../hooks/useReports";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { formatCurrency, formatDate } from "../../utils/format";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Layers, Calendar, Download, Package, Database, Activity, AlertCircle, Printer } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const { 
    summary, lowStock, txSummary, txDetails, 
    period, setPeriod, 
    selectedDate, setSelectedDate, 
    selectedWeek, setSelectedWeek,
    selectedMonth, setSelectedMonth,
    isLoading, error 
  } = useReports();
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  const filteredTxDetails = React.useMemo(() => {
    return txDetails.filter(detail => typeFilter === "ALL" || detail.type === typeFilter);
  }, [txDetails, typeFilter]);

  const handleDownload = () => {
    if (!filteredTxDetails.length) return;
    
    // Format period label
    const periodLabel = period === "Day" ? `Day (${selectedDate})` :
                        period === "Week" ? `Week (${selectedWeek})` :
                        period === "Month" ? `Month (${selectedMonth})` : "";
    
    const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create Report Header (Kop Laporan)
    const reportHeader = [
      "LAPORAN INVENTORI",
      `Periode: ${periodLabel}`,
      `Dicetak pada: ${printDate}`,
      "" // empty row for spacing
    ];

    // Create CSV table header
    const headers = ["Date", "Transaction Code", "Type", "Product Name", "Quantity", "Unit Price", "Total Value", "User"];
    
    // Create CSV rows
    const rows = filteredTxDetails.map(detail => {
      return [
        formatDate(detail.txDate).replace(/,/g, ""),
        detail.txCode,
        detail.type,
        `"${detail.productName || 'Unknown'}"`,
        detail.quantity,
        detail.unitPrice,
        Number(detail.unitPrice) * detail.quantity,
        `"${detail.userName || 'System'}"`
      ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + reportHeader.join("\n") + "\n"
      + headers.join(",") + "\n" 
      + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (user?.role === "STAFF") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 text-center max-w-md">
            You do not have permission to view this page. Only administrators can view reports.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
            <p className="text-gray-500">Detailed overview of inventory health and activities.</p>
          </div>
          
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm print:hidden">
            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="bg-transparent text-sm font-medium text-gray-700 py-1.5 pl-2 pr-6 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
            </select>
          </div>
          
          {period === "Day" && (
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm print:hidden">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          )}
          {period === "Week" && (
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm print:hidden">
              <input 
                type="week" 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          )}
          {period === "Month" && (
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm print:hidden">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-900">Laporan Inventori</h2>
          <p className="text-gray-600 mt-2">
            Periode: {
              period === "Day" ? `Day (${selectedDate})` :
              period === "Week" ? `Week (${selectedWeek})` :
              period === "Month" ? `Month (${selectedMonth})` : ""
            }
          </p>
          <p className="text-gray-500 text-sm">Dicetak pada: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Activity Summary Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-6 items-center print:bg-white print:border-none print:p-0 print:mb-6">
              <div className="text-sm font-semibold text-gray-700 mr-2">
                Transaction Summary ({
                  period === "Day" ? `Day (${selectedDate})` : 
                  period === "Week" ? `Week (${selectedWeek})` : 
                  period === "Month" ? `Month (${selectedMonth})` : ""
                }):
              </div>
              {txSummary.length === 0 ? (
                <span className="text-sm text-gray-500">No activity recorded.</span>
              ) : (
                txSummary.map((tx) => (
                  <div key={tx.type} className="flex items-center space-x-2 text-sm">
                    {tx.type === "IN" ? (
                      <span className="flex items-center text-green-700 font-medium bg-white px-3 py-1 rounded-md shadow-sm border border-green-100">
                        <ArrowDownRight className="mr-1.5 h-4 w-4" /> Stock IN: {tx.count}
                      </span>
                    ) : tx.type === "OUT" ? (
                      <span className="flex items-center text-orange-700 font-medium bg-white px-3 py-1 rounded-md shadow-sm border border-orange-100">
                        <ArrowUpRight className="mr-1.5 h-4 w-4" /> Stock OUT: {tx.count}
                      </span>
                    ) : (
                      <span className="flex items-center text-blue-700 font-medium bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100">
                        <Layers className="mr-1.5 h-4 w-4" /> Adjustments: {tx.count}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-8">
              {/* Transaction Details Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Detailed Activity Log</h2>
                    <p className="text-sm text-gray-500">Detailed breakdown of item movements.</p>
                  </div>
                  <div className="flex items-center space-x-3 flex-wrap gap-2 print:hidden">
                    <select
                      className="h-8 text-sm rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="ALL">All Types</option>
                      <option value="IN">Stock In (IN)</option>
                      <option value="OUT">Stock Out (OUT)</option>
                      <option value="ADJUSTMENT">Adjustment (ADJ)</option>
                    </select>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {filteredTxDetails.length} items
                    </span>
                    <button 
                      onClick={handleDownload}
                      disabled={filteredTxDetails.length === 0}
                      className="flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50 whitespace-nowrap transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="flex items-center px-4 py-2 bg-purple-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-purple-700 shadow-sm whitespace-nowrap transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak
                    </button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-auto print:max-h-none print:overflow-visible">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-right">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTxDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No detailed activity found for this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTxDetails.map((detail) => (
                          <TableRow key={detail.id}>
                            <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                              {formatDate(detail.txDate)}
                            </TableCell>
                            <TableCell>
                              {detail.type === "IN" ? (
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">IN</span>
                              ) : detail.type === "OUT" ? (
                                <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded">OUT</span>
                              ) : (
                                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">ADJ</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 max-w-[150px] truncate" title={detail.productName}>
                              {detail.productName || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right text-gray-900 font-bold">
                              {detail.type === "OUT" ? "-" : "+"}{detail.quantity}
                            </TableCell>
                            <TableCell className="text-right text-gray-600">
                              {formatCurrency(Number(detail.unitPrice) * detail.quantity)}
                            </TableCell>
                            <TableCell className="text-right text-gray-700 font-medium whitespace-nowrap">
                              {detail.userName || "System"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Low Stock Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:break-inside-avoid">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/30 print:bg-transparent print:border-b-2 print:border-gray-900">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 print:hidden" />
                  <h2 className="text-lg font-semibold text-gray-900">Low Stock Items ({summary?.lowStockCount || 0})</h2>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Capital Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No low stock items. Your inventory is healthy!
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStock.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-gray-900">{product.sku}</TableCell>
                        <TableCell className="text-gray-900">{product.name}</TableCell>
                        <TableCell className="text-gray-500">{product.categoryName || "-"}</TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">{product.stock}</span>
                        </TableCell>
                        <TableCell className="text-gray-500">{product.minStock}</TableCell>
                        <TableCell className="text-gray-900">
                          {formatCurrency(Number(product.buyPrice) * product.stock)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

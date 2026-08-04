"use client";

import React from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useReports, ReportPeriod } from "../../hooks/useReports";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { formatCurrency, formatDate } from "../../utils/format";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Layers, Calendar } from "lucide-react";

export default function ReportsPage() {
  const { summary, lowStock, txSummary, txDetails, period, setPeriod, isLoading, error } = useReports();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
            <p className="text-gray-500">Detailed overview of inventory health and activities.</p>
          </div>
          
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="bg-transparent text-sm font-medium text-gray-700 py-1.5 pl-2 pr-6 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction Summary Table (Takes 1 column on LG) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-1 h-fit">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
                  <p className="text-sm text-gray-500">
                    {period === "today" ? "Today's" : period === "week" ? "This week's" : period === "month" ? "This month's" : "All time"} volume.
                  </p>
                </div>
                <Table>
                  <TableBody>
                    {txSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                          No activity.
                        </TableCell>
                      </TableRow>
                    ) : (
                      txSummary.map((tx) => (
                        <TableRow key={tx.type}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {tx.type === "IN" ? (
                                <span className="flex items-center text-green-700 font-medium">
                                  <ArrowDownRight className="mr-2 h-4 w-4" /> Stock IN
                                </span>
                              ) : tx.type === "OUT" ? (
                                <span className="flex items-center text-orange-700 font-medium">
                                  <ArrowUpRight className="mr-2 h-4 w-4" /> Stock OUT
                                </span>
                              ) : (
                                <span className="flex items-center text-blue-700 font-medium">
                                  <Layers className="mr-2 h-4 w-4" /> Stock ADJ
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-900 font-semibold">
                            {tx.count} txs
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Transaction Details Table (Takes 2 columns on LG) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Detailed Activity Log</h2>
                    <p className="text-sm text-gray-500">Detailed breakdown of item movements.</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {txDetails.length} items
                  </span>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {txDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No detailed activity found for this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        txDetails.map((detail) => (
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
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Low Stock Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/30">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
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

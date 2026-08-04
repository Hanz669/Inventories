"use client";

import React from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Package, ArrowUpRight, ArrowDownRight, Layers, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useReports } from "../../hooks/useReports";
import { formatCurrency } from "../../utils/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, lowStock, txSummary, isLoading, error } = useReports();

  const getTxCount = (type: string) => {
    return txSummary.find((tx) => tx.type === type)?.count || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}! Here's an overview of your inventory.</p>
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
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Products"
                value={summary?.totalProducts || 0}
                icon={Package}
                trend="Total items in catalog"
                trendUp={true}
              />
              <StatCard
                title="Total Stock Items"
                value={summary?.totalStockItems || 0}
                icon={Layers}
                trend="Physical items available"
                trendUp={true}
              />
              <StatCard
                title="Stock In Txs"
                value={getTxCount("IN")}
                icon={ArrowDownRight}
                trend="Receiving transactions"
                trendUp={true}
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatCard
                title="Stock Out Txs"
                value={getTxCount("OUT")}
                icon={ArrowUpRight}
                trend="Dispatch transactions"
                trendUp={false}
                iconColor="text-orange-600"
                iconBg="bg-orange-100"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Low Stock Alerts */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {summary?.lowStockCount || 0} Items
                  </span>
                </div>
                
                <div className="space-y-4 flex-1 overflow-auto max-h-[400px] pr-2">
                  {lowStock.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">All products have sufficient stock.</p>
                  ) : (
                    lowStock.map((product) => (
                      <div key={product.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600">Stock: {product.stock}</p>
                          <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Transactions Summary */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col h-full">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Activity</h2>
                <div className="space-y-4 flex-1">
                   {txSummary.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No transactions recorded yet.</p>
                  ) : (
                    txSummary.map((tx) => (
                      <div key={tx.type} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            tx.type === "IN" ? "bg-green-100 text-green-600" :
                            tx.type === "OUT" ? "bg-orange-100 text-orange-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {tx.type === "IN" ? <ArrowDownRight className="h-5 w-5" /> :
                             tx.type === "OUT" ? <ArrowUpRight className="h-5 w-5" /> :
                             <Layers className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tx.type === "IN" ? "Stock Received" :
                               tx.type === "OUT" ? "Stock Dispatched" : "Stock Adjustments"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{tx.count} records</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-100" 
}: any) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-gray-500">
          {trend}
        </span>
      </div>
    </div>
  );
}

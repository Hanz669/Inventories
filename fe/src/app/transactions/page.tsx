"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useTransactions } from "../../hooks/useTransactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Plus, ArrowDownRight, ArrowUpRight, Layers } from "lucide-react";

export default function TransactionsPage() {
  const { transactions, isLoading, error } = useTransactions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Transactions</h1>
            <p className="text-gray-500">View history of stock movements (In, Out, Adjustments).</p>
          </div>
          <Link href="/transactions/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tx Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-gray-900">{tx.txCode}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(tx.txDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1.5">
                          {tx.type === "IN" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <ArrowDownRight className="mr-1 h-3 w-3" /> In
                            </span>
                          ) : tx.type === "OUT" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <ArrowUpRight className="mr-1 h-3 w-3" /> Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Layers className="mr-1 h-3 w-3" /> Adj
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 max-w-xs truncate">
                        {tx.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

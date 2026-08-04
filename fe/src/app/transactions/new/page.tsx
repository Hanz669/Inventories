"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { useTransactions } from "../../../hooks/useTransactions";
import { useProducts } from "../../../hooks/useProducts";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { TransactionItemPayload } from "../../../lib/api/transactions";

export default function NewTransactionPage() {
  const router = useRouter();
  const { createTransaction, error: txError } = useTransactions();
  const { products, isLoading: isLoadingProducts } = useProducts();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransactionItemPayload[]>([
    { productId: 0, quantity: 1, unitPrice: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { productId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof TransactionItemPayload, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price when product is selected
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = type === "IN" ? Number(product.buyPrice) : Number(product.sellPrice);
      }
    }
    
    setItems(newItems);
  };

  const handleTypeChange = (newType: "IN" | "OUT" | "ADJUSTMENT") => {
    setType(newType);
    // Re-evaluate prices based on type
    const newItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return { ...item, unitPrice: newType === "IN" ? Number(product.buyPrice) : Number(product.sellPrice) };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (items.some(item => item.productId === 0)) {
      alert("Please select a product for all items.");
      return;
    }
    if (items.some(item => item.quantity <= 0)) {
      alert("Quantity must be greater than 0 for all items.");
      return;
    }

    setIsSubmitting(true);
    const success = await createTransaction({
      type,
      notes,
      items
    });
    
    if (success) {
      router.push("/transactions");
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Transaction</h1>
            <p className="text-gray-500">Record incoming, outgoing, or stock adjustments.</p>
          </div>
        </div>

        {txError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {txError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">General Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as any)}
                >
                  <option value="IN">Stock IN (Receive from Supplier)</option>
                  <option value="OUT">Stock OUT (Sell / Dispatch)</option>
                  <option value="ADJUSTMENT">Adjustment (Damage / Lost)</option>
                </select>
              </div>

              <Input
                label="Notes / Reference"
                placeholder="e.g. PO-2023-001 or Customer Name"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-blue-600">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="w-full md:flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, "productId", Number(e.target.value))}
                    required
                    disabled={isLoadingProducts}
                  >
                    <option value={0} disabled>Select product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-32">
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    required
                  />
                </div>
                
                <div className="w-full md:w-48">
                  <Input
                    label="Unit Price"
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                    required
                  />
                </div>
                
                <div className="pb-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              isLoading={isSubmitting}
            >
              Confirm Transaction
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

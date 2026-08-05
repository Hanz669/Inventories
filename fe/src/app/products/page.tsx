"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { formatCurrency } from "../../utils/format";
import { Product } from "../../types";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function ProductsPage() {
  const { products, meta, isLoading, error, createProduct, updateProduct, deleteProduct, refetch } = useProducts();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      refetch({ page, limit, search: searchQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchQuery, refetch]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: "",
    name: "",
    categoryId: "",
    stock: 0,
    minStock: 0,
    buyPrice: 0,
    sellPrice: 0,
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      sku: `PRD-${Math.floor(Math.random() * 10000)}`,
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      stock: 0,
      minStock: 5,
      buyPrice: 0,
      sellPrice: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId ?? "",
      stock: product.stock,
      minStock: product.minStock,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let success = false;
    
    const payload = {
      ...formData,
      categoryId: formData.categoryId || null,
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      buyPrice: Number(formData.buyPrice),
      sellPrice: Number(formData.sellPrice),
    };

    if (editingId) {
      success = await updateProduct(editingId, payload);
      if (success) showToast("Product updated successfully", "success");
    } else {
      success = await createProduct(payload);
      if (success) showToast("Product created successfully", "success");
    }

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Delete Product",
      message: `Are you sure you want to delete product "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });

    if (isConfirmed) {
      const success = await deleteProduct(id);
      if (success) {
        showToast("Product deleted successfully", "success");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
            <p className="text-gray-500">Manage your product catalog and view current stock levels.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-9 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {isAdmin && (
              <Button className="flex items-center w-full sm:w-auto" onClick={handleOpenCreate} disabled={isCategoriesLoading}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading && !isModalOpen ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No products found. Start by adding one.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-gray-500">
                        {((meta?.page || 1) - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{product.sku}</TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </TableCell>
                      <TableCell className="text-gray-900">{formatCurrency(Number(product.sellPrice))}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock <= product.minStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {isAdmin ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(product)}
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic px-2">Read Only</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{((meta.page - 1) * limit) + 1}</span> to <span className="font-medium">{Math.min(meta.page * limit, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="SKU"
                  placeholder="PRD-123"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
                <Input
                  label="Product Name"
                  placeholder="e.g. Mechanical Keyboard"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                
                <div className="flex flex-col space-y-1">
                  <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.categoryId ?? ""}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Initial Stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                    disabled={!!editingId} // Usually shouldn't edit stock directly after creation, should use Tx
                    title={editingId ? "Use Transactions to update stock" : ""}
                  />
                  <Input
                    label="Min Stock Alert"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    required
                  />
                </div>

                <Input
                  label="Buy Price"
                  type="number"
                  min="0"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Sell Price"
                  type="number"
                  min="0"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  isLoading={isSubmitting}
                >
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

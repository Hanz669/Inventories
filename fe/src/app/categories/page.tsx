"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, isLoading, error, createCategory, updateCategory, deleteCategory } = useCategories();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setCategoryName(currentName);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let success = false;
    
    if (editingId) {
      success = await updateCategory(editingId, categoryName);
      if (success) showToast("Category updated successfully", "success");
    } else {
      success = await createCategory(categoryName);
      if (success) showToast("Category created successfully", "success");
    }

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete category "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });

    if (isConfirmed) {
      const success = await deleteCategory(id);
      if (success) {
        showToast("Category deleted successfully", "success");
      }
    }
  };

  if (user?.role === "STAFF") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 text-center max-w-md">
            You do not have permission to view this page. Only administrators can manage categories.
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
            <p className="text-gray-500">Manage product categories for better organization.</p>
          </div>
          <Button className="flex items-center" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
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
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat, index) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenEdit(cat.id, cat.name)}
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(cat.id, cat.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Category" : "Add New Category"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g. Electronics"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex justify-end space-x-3 pt-4">
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
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

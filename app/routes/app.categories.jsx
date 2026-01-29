import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import "../styles/categories.css";

export async function loader({ request }) {
  await authenticate.admin(request);
  
  const categories = await db.category.findMany({
    include: {
      subcategories: {
        include: {
          partTypes: {
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return { categories };
}

export default function Categories() {
  const { categories } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "" });

  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState({ name: "" });

  const [showPartTypeForm, setShowPartTypeForm] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [newPartType, setNewPartType] = useState({ name: "" });

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data?.deleted) {
        shopify.toast.show("Deleted successfully");
      } else if (fetcher.data?.updated) {
        shopify.toast.show("Updated successfully");
      } else {
        shopify.toast.show("Created successfully");
      }
      setShowForm(false);
      setShowSubcategoryForm(false);
      setShowPartTypeForm(false);
      setEditingCategory(null);
      setNewCategory({ name: "" });
      setNewSubcategory({ name: "" });
      setNewPartType({ name: "" });
      window.location.reload();
    }
  }, [fetcher.data, shopify]);

  const handleCreateCategory = () => {
    const formData = new FormData();
    if (editingCategory) {
      formData.append("action", "updateCategory");
      formData.append("categoryId", editingCategory.id);
    } else {
      formData.append("action", "createCategory");
    }
    formData.append("name", newCategory.name);
    fetcher.submit(formData, { method: "post" });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: "" });
    setShowForm(false);
  };

  const handleDeleteCategory = (categoryId) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all subcategories and part types under it.")) {
      const formData = new FormData();
      formData.append("action", "deleteCategory");
      formData.append("categoryId", categoryId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleAddSubcategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setNewSubcategory({ name: "" });
    setShowSubcategoryForm(true);
  };

  const handleCreateSubcategory = () => {
    const formData = new FormData();
    formData.append("action", "createSubcategory");
    formData.append("categoryId", selectedCategoryId);
    formData.append("name", newSubcategory.name);
    fetcher.submit(formData, { method: "post" });
  };

  const handleAddPartType = (subCategoryId) => {
    setSelectedSubCategoryId(subCategoryId);
    setNewPartType({ name: "" });
    setShowPartTypeForm(true);
  };

  const handleCreatePartType = () => {
    const formData = new FormData();
    formData.append("action", "createPartType");
    formData.append("subCategoryId", selectedSubCategoryId);
    formData.append("name", newPartType.name);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>Category Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setEditingCategory(null);
            setNewCategory({ name: "" });
            setShowForm(!showForm);
          }}
        >
          {showForm && !editingCategory ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <div className="form-box">
            <h2>{editingCategory ? "Edit Category" : "Create New Category"}</h2>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleCreateCategory}>
                {editingCategory ? "Update Category" : "Create Category"}
              </button>
              <button className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubcategoryForm && (
        <div className="form-section">
          <div className="form-box">
            <h2>Add Subcategory</h2>
            <div className="form-group">
              <label>Subcategory Name</label>
              <input
                type="text"
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ name: e.target.value })}
                placeholder="Enter subcategory name"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleCreateSubcategory}>
                Create Subcategory
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSubcategoryForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPartTypeForm && (
        <div className="form-section">
          <div className="form-box">
            <h2>Add Part Type</h2>
            <div className="form-group">
              <label>Part Type Name</label>
              <input
                type="text"
                value={newPartType.name}
                onChange={(e) => setNewPartType({ name: e.target.value })}
                placeholder="Enter part type name"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleCreatePartType}>
                Create Part Type
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPartTypeForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet. Create your first category!</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <h2>{category.name}</h2>
                <div className="category-actions">
                  <button className="btn btn-plain" onClick={() => handleEditCategory(category)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteCategory(category.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="subcategories-section">
                <div className="section-header">
                  <h3>Subcategories</h3>
                  <button className="btn btn-primary btn-small" onClick={() => handleAddSubcategory(category.id)}>
                    Add Subcategory
                  </button>
                </div>

                {category.subcategories.length === 0 ? (
                  <p className="empty-state-inline">No subcategories</p>
                ) : (
                  category.subcategories.map((sub) => (
                    <div key={sub.id} className="subcategory-card">
                      <div class="subcategory-header">
                        <div>{sub.name}</div>
                        <div className="category-actions">
                          <button className="btn btn-plain" onClick="#">
                            Edit
                          </button>
                          <button className="btn btn-danger" onClick="#">
                            Delete
                          </button>
                        </div>
                      </div>
                        
                      <div className="parttypes-section">
                        <div className="section-header">
                          <h5>Part Types</h5>
                          <button className="btn btn-primary btn-small" onClick={() => handleAddPartType(sub.id)}>
                            Add Part Type
                          </button>
                        </div>

                        {sub.partTypes.length === 0 ? (
                          <p className="empty-state-inline">No part types</p>
                        ) : (
                          <ul className="parttypes-list">
                            {sub.partTypes.map((pt) => (
                              <li key={pt.id}>{pt.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "createCategory") {
    const name = formData.get("name");
    await db.category.create({
      data: { name }
    });
    return { success: true };
  }

  if (action === "updateCategory") {
    const categoryId = parseInt(formData.get("categoryId"));
    const name = formData.get("name");
    await db.category.update({
      where: { id: categoryId },
      data: { name }
    });
    return { success: true, updated: true };
  }

  if (action === "deleteCategory") {
    const categoryId = parseInt(formData.get("categoryId"));
    await db.category.delete({
      where: { id: categoryId }
    });
    return { success: true, deleted: true };
  }

  if (action === "createSubcategory") {
    const categoryId = parseInt(formData.get("categoryId"));
    const name = formData.get("name");
    await db.subCategory.create({
      data: { name, categoryId }
    });
    return { success: true };
  }

  if (action === "createPartType") {
    const subCategoryId = parseInt(formData.get("subCategoryId"));
    const name = formData.get("name");
    await db.partType.create({
      data: { name, subCategoryId }
    });
    return { success: true };
  }

  return { success: false };
}

import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import partTypeData from "../data/partTypeData";
import "../styles/categories.css";
import Modal from "../components/Modal";

// Server-side loader: Fetches categories with nested subcategories and part types
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
  // Data & Core Hooks
  const { categories } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  // Category State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "" });

  // Subcategory State
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState({ name: "" });

  // Part Type State
  const [showPartTypeModal, setShowPartTypeModal] = useState(false);
  const [editingPartType, setEditingPartType] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [newPartType, setNewPartType] = useState({ name: "" });
  const [partTypeSearch, setPartTypeSearch] = useState("");
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  // UI State
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Filter part types based on search
  const filteredPartTypes = partTypeSearch
    ? partTypeData.filter(pt => 
        pt.PartTerminologyName.toLowerCase().includes(partTypeSearch.toLowerCase())
      ).slice(0, 100) // Limit to 100 results for performance
    : partTypeData.slice(0, 100); // Show first 100 by default

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data?.deleted) {
        shopify.toast.show("Deleted successfully");
      } else if (fetcher.data?.updated) {
        shopify.toast.show("Updated successfully");
      } else {
        shopify.toast.show("Created successfully");
      }

      setShowCategoryModal(false);
      setShowSubcategoryModal(false);
      setShowPartTypeModal(false);
      setEditingCategory(null);
      setEditingSubcategory(null);
      setEditingPartType(null);
      setNewCategory({ name: "" });
      setNewSubcategory({ name: "" });
      setNewPartType({ name: "" });
      setErrorMessage("");
      window.location.reload();
    } else if (fetcher.data?.error) {
        setErrorMessage(fetcher.data.error);
    }
  }, [fetcher.data, shopify]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPartTypeDropdown && !event.target.closest('.searchable-select')) {
        setShowPartTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPartTypeDropdown]);

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
    setShowCategoryModal(true);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: "" });
    setShowCategoryModal(false);
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
    setShowSubcategoryModal(true);
  };

  const handleCancelSubcategoryEdit = () => {
    setEditingSubcategory(null);
    setNewSubcategory({ name: "" });
    setShowSubcategoryModal(false);
  };

  const handleCreateSubcategory = () => {
    const formData = new FormData();
    
    if (editingSubcategory) {
      formData.append("action", "updateSubcategory");
      formData.append("subcategoryId", editingSubcategory.id);
    } else {
      formData.append("action", "createSubcategory");
      formData.append("categoryId", selectedCategoryId);
    }
    
    formData.append("name", newSubcategory.name);
    fetcher.submit(formData, { method: "post" });
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setNewSubcategory({ name: subcategory.name });
    setShowSubcategoryModal(true);
  };

  const handleDeleteSubcategory = (subcategoryId) => {
    if (confirm("Are you sure you want to delete this subcategory? This will also delete all part types under it.")) {
      const formData = new FormData();
      formData.append("action", "deleteSubcategory");
      formData.append("subcategoryId", subcategoryId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleAddPartType = (subCategoryId) => {
    setSelectedSubCategoryId(subCategoryId);
    setNewPartType({ name: "" });
    setShowPartTypeModal(true);
  };

  const handleCreatePartType = () => {
    const formData = new FormData();
    
    // Find the PartTerminologyID from partTypeData
    const partTypeInfo = partTypeData.find(pt => pt.PartTerminologyName === newPartType.name);
    
    if (editingPartType) {
      formData.append("action", "updatePartType");
      formData.append("partTypeId", editingPartType.id);
    } else {
      formData.append("action", "createPartType");
      formData.append("subCategoryId", selectedSubCategoryId);
    }
    
    formData.append("name", newPartType.name);
    if (partTypeInfo) {
        formData.append("terminologyId", partTypeInfo.PartTerminologyID);
    }

    fetcher.submit(formData, { method: "post" });
  };

  const handleCancelPartTypeEdit = () => {
    setEditingPartType(null);
    setNewPartType({ name: "" });
    setShowPartTypeModal(false);
  };

  const handleEditPartType = (partType) => {
    setEditingPartType(partType);
    setNewPartType({ name: partType.name });
    setShowPartTypeModal(true);
  };

  const handleDeletePartType = (partTypeId) => {
    if (confirm("Are you sure you want to delete this part type?")) {
      const formData = new FormData();
      formData.append("action", "deletePartType");
      formData.append("partTypeId", partTypeId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  return (
    <div className="category-page">
      <div className="section">
        <div className="category-section-label">
          <span>Categories</span>
          <button className="btn btn-primary" onClick={() => {setEditingCategory(null); setNewCategory({ name: "" }); setShowCategoryModal(!showCategoryModal);}}>
            {showCategoryModal && !editingCategory ? "Cancel" : "Add Category"}
          </button>
        </div>

        <Modal
          isOpen={showCategoryModal}
          onClose={handleCancelEdit}
          title={editingCategory ? "Edit Category" : "Create New Category"}
          errorMessage={errorMessage}
          fieldLabel="Category Name"
          fieldValue={newCategory.name}
          onFieldChange={(e) => setNewCategory({ name: e.target.value })}
          fieldPlaceholder="Enter category name"
          onSubmit={handleCreateCategory}
          submitLabel={editingCategory ? "Update Category" : "Create Category"}
          isEditing={!!editingCategory}
        />

        <Modal
          isOpen={showSubcategoryModal}
          onClose={handleCancelSubcategoryEdit}
          title={editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}
          errorMessage={errorMessage}
          fieldLabel="Subcategory Name"
          fieldValue={newSubcategory.name}
          onFieldChange={(e) => setNewSubcategory({ name: e.target.value })}
          fieldPlaceholder="Enter subcategory name"
          onSubmit={handleCreateSubcategory}
          submitLabel={editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
          isEditing={!!editingSubcategory}
        />

        <Modal
          isOpen={showPartTypeModal}
          onClose={handleCancelPartTypeEdit}
          title={editingPartType ? "Edit Part Type" : "Add Part Type"}
          errorMessage={errorMessage}
          onSubmit={handleCreatePartType}
          submitLabel={editingPartType ? "Update Part Type" : "Create Part Type"}
        >
          <div className="form-group">
            <label>Part Type Name</label>
            <div className="searchable-select" onClick={() => setShowPartTypeDropdown(!showPartTypeDropdown)}>
              <input className="searchable-select-input"
                type="text"
                value={newPartType.name || partTypeSearch}
                onChange={(e) => {
                  setPartTypeSearch(e.target.value);
                  setNewPartType({ name: "" });
                  setShowPartTypeDropdown(true);
                }}
                onFocus={() => setShowPartTypeDropdown(true)}
                placeholder="Search or select a part type..."
              />
              <span>▼</span>
              {showPartTypeDropdown && (
                <div className="dropdown-list">
                  {filteredPartTypes.map((pt) => (
                    <div
                      key={pt.PartTerminologyID}
                      className="dropdown-list-item"
                      onClick={() => {
                        setNewPartType({ name: pt.PartTerminologyName });
                        setPartTypeSearch("");
                        setShowPartTypeDropdown(false);
                      }}
                    >
                      {pt.PartTerminologyName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* {showPartTypeModal && (
          <div className="modal-overlay" onClick={handleCancelPartTypeEdit}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={handleCancelPartTypeEdit}>×</button>
              <h2>{editingPartType ? "Edit Part Type" : "Add Part Type"}</h2>

              {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
              )}

              <div className="form-group">
                <label>Part Type Name</label>
                <div className="searchable-select" onClick={() => setShowPartTypeDropdown(true)}>
                  <input type="text" value={newPartType.name || partTypeSearch}
                    onChange={(e) => {
                      setPartTypeSearch(e.target.value);
                      setNewPartType({ name: "" });
                      setShowPartTypeDropdown(true);
                    }}
                    onFocus={() => setShowPartTypeDropdown(true)}
                    placeholder="Search or select a part type..."
                  />
                  <span>
                    ▼
                  </span>
                  {showPartTypeDropdown && (
                    <div className="dropdown-list">
                      {filteredPartTypes.map((pt) => (
                        <div
                          key={pt.PartTerminologyID}
                          className="dropdown-list-item"
                          onClick={() => {
                            console.log('Selected Part Type:', pt.PartTerminologyName, 'ID:', pt.PartTerminologyID);
                            setNewPartType({ name: pt.PartTerminologyName });
                            setPartTypeSearch("");
                            setShowPartTypeDropdown(false);
                          }}
                        >
                          {pt.PartTerminologyName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleCreatePartType}>
                  {editingPartType ? "Update Part Type" : "Create Part Type"}
                </button>
                <button className="btn btn-secondary" onClick={handleCancelPartTypeEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )} */}

        <div className="category-section-body">
          {categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories yet. Create your first category!</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="category-item">
                <div className="category-item-header">
                  <div className="left-header">
                    <button className="btn-toggle" onClick={() => toggleCategory(category.id)} aria-label="Toggle category">
                      {expandedCategories[category.id] ? "−" : "+"}
                    </button>
                    <div className="header">{category.name}</div>
                  </div>
                  <div className="category-actions">
                    <button className="btn btn-plain" onClick={() => handleEditCategory(category)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteCategory(category.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                {expandedCategories[category.id] && (
                <div className="category-item-body">

                  <div className="section">
                    <div className="subcategory-section-label">
                      <span>Subcategories</span>
                      <button className="btn btn-primary" onClick={() => handleAddSubcategory(category.id)}>
                        Add Subcategory
                      </button>
                    </div>

                    <div className="subcategory-section-body">
                      {category.subcategories.length === 0 ? (
                        <p className="empty-state-inline">No subcategories</p>
                      ) : (
                        category.subcategories.map((sub) => (
                          <div key={sub.id} className="subcategory-item">
                            <div className="subcategory-item-header">
                              <div className="left-header">
                                <button className="btn-toggle" onClick={() => toggleSubcategory(sub.id)} aria-label="Toggle subcategory">
                                  {expandedSubcategories[sub.id] ? "−" : "+"}
                                </button>
                                <div className="header">{sub.name}</div>
                              </div>

                              <div className="category-actions">
                                <button className="btn btn-plain" onClick={() => handleEditSubcategory(sub)}>
                                  Edit
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteSubcategory(sub.id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                              
                            {expandedSubcategories[sub.id] && (
                            <div className="subcategory-item-body">
                              
                              <div className="section">
                                <div className="parttype-section-label">
                                  <span>Part Types</span>
                                  <button className="btn btn-primary" onClick={() => handleAddPartType(sub.id)}>
                                    Add Part Type
                                  </button>
                                </div>

                                {sub.partTypes.length === 0 ? (
                                  <p className="empty-state-inline">No part types for this sub-category</p>
                                ) : (
                                  <div className="parttype-section-body">
                                    {sub.partTypes.map((pt) => (
                                      <div className="parttype-item header" key={pt.id}>{pt.name}
                                        <div className="category-actions">
                                          <button className="btn btn-plain" onClick={() => handleEditPartType(pt)}>
                                            Edit
                                          </button>
                                          <button className="btn btn-danger" onClick={() => handleDeletePartType(pt.id)}>
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                            )}

                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
                )}

              </div>
            ))
          )}
        </div>
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

    try {
      await db.category.create({
        data: { name }
      });
      return { success: true };
    } catch (error) {
      if (error.code === 'P2002') {
            return { success: false, error: `Category "${name}" already exists` };
        }
        console.error("Error creating category:", error);
        return { success: false, error: "Failed to create category" };
    }

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
    
    try {
        await db.subCategory.create({
            data: { name, categoryId }
        });
        return { success: true };
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: false, error: `Subcategory "${name}" already exists in this category` };
        }
        console.error("Error creating subcategory:", error);
        return { success: false, error: "Failed to create subcategory" };
    }
  }

  if (action === "updateSubcategory") {
    const subcategoryId = parseInt(formData.get("subcategoryId"));
    const name = formData.get("name");
    await db.subCategory.update({
      where: { id: subcategoryId },
      data: { name }
    });
    return { success: true, updated: true };
  }

  if (action === "deleteSubcategory") {
    const subcategoryId = parseInt(formData.get("subcategoryId"));
    await db.subCategory.delete({
      where: { id: subcategoryId }
    });
    return { success: true, deleted: true };
  }

  if (action === "createPartType") {
    const subCategoryId = parseInt(formData.get("subCategoryId"));
    const name = formData.get("name");
    const terminologyId = formData.get("terminologyId") ? parseInt(formData.get("terminologyId")) : null;
    
    try {
        await db.partType.create({
            data: { name, subCategoryId, terminologyId }
        });
        return { success: true };
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: false, error: `Part type "${name}" already exists in this subcategory` };
        }
        console.error("Error creating part type:", error);
        return { success: false, error: "Failed to create part type" };
    }
  }

  if (action === "updatePartType") {
    const partTypeId = parseInt(formData.get("partTypeId"));
    const name = formData.get("name");
    await db.partType.update({
      where: { id: partTypeId },
      data: { name }
    });
    return { success: true, updated: true };
  }

  if (action === "deletePartType") {
    const partTypeId = parseInt(formData.get("partTypeId"));
    await db.partType.delete({
      where: { id: partTypeId }
    });
    return { success: true, deleted: true };
  }

  return { success: false };
}
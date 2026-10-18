import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Upload, Image as ImageIcon, Trash2, CheckCircle2, FileImage } from 'lucide-react';
import { Product, Category, InventoryItem } from '../types';
import { getCategoryDrinkImage } from '../data/drinkImages';
import { useRealtimeSync } from '../lib/realtimeSync';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('110');
  const [imageUrl, setImageUrl] = useState('');
  const [importedFileName, setImportedFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [productType, setProductType] = useState<'Drink' | 'Food'>('Drink');
  const [upsizePrice, setUpsizePrice] = useState('130');
  const [recipeItems, setRecipeItems] = useState<{ inventoryItemId: string; quantity: number }[]>([]);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Automatically update when products, categories, or inventory are edited in Supabase
  useRealtimeSync(['products', 'categories', 'inventory'], () => {
    console.log('[ProductsView] Supabase change received! Auto-refreshing product catalog...');
    fetchData();
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes, invRes] = await Promise.all([
        fetch('/api/products/all').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/inventory').catch(() => null)
      ]);
      const prods = prodRes && prodRes.ok ? await prodRes.json().catch(() => []) : [];
      const cats = catRes && catRes.ok ? await catRes.json().catch(() => []) : [];
      const invs = invRes && invRes.ok ? await invRes.json().catch(() => []) : [];

      if (Array.isArray(prods)) setProducts(prods.filter((p: Product) => p.isAvailable));
      if (Array.isArray(cats)) {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      }
      if (Array.isArray(invs)) setInventory(invs);
    } catch (e) {
      console.warn('[ProductsView] Error fetching data:', e);
    }
  };

  const processImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, JPEG, PNG, WEBP).');
      return;
    }

    setImportedFileName(file.name);
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsCompressing(false);
        return;
      }

      // Optimize image dimensions to max 800px for crisp, lightweight storage
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outputFormat, 0.88);
          setImageUrl(compressed);
        } else {
          setImageUrl(rawDataUrl);
        }
        setIsCompressing(false);
      };

      img.onerror = () => {
        setImageUrl(rawDataUrl);
        setIsCompressing(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      alert('Failed to read image file.');
      setIsCompressing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setPrice('110');
    setImageUrl('');
    setImportedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setProductType('Drink');
    setUpsizePrice('130');
    setRecipeItems([{ inventoryItemId: inventory[0]?.id || '', quantity: 18 }]);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.categoryId || categories[0]?.id || '');
    setPrice(p.price.toString());
    setImageUrl(p.imageUrl || '');
    setImportedFileName(p.imageUrl?.startsWith('data:') ? 'Imported Image' : '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setProductType(p.productType);
    setUpsizePrice(p.upsizePrice ? p.upsizePrice.toString() : '');
    setRecipeItems(p.recipes ? p.recipes.map(r => ({ inventoryItemId: r.inventoryItemId, quantity: r.quantity })) : []);
    setShowModal(true);
  };

  const handleAddRecipeRow = () => {
    if (inventory.length === 0) return;
    setRecipeItems([...recipeItems, { inventoryItemId: inventory[0].id, quantity: 10 }]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      categoryId,
      price: Number(price),
      imageUrl,
      productType,
      upsizePrice: upsizePrice ? Number(upsizePrice) : null,
      recipes: recipeItems
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
      }
    } catch (e) {
      alert('Error saving product');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const executeArchiveProduct = async () => {
    if (!archiveTarget) return;
    try {
      const res = await fetch(`/api/products/${archiveTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`" ${archiveTarget.name} " archived successfully! Check the Archive section to view or restore.`);
        setArchiveTarget(null);
        fetchData();
      }
    } catch (e) {
      showToast('Error archiving product.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.categoryName && product.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Menu Management</h1>
          <p className="page-subtitle">Configure beverage options, pricing, upsize costs, and ingredient recipe deductions</p>
        </div>

        <div className="page-actions">
          <button className="btn-primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="fa-solid fa-plus" style={{ fontSize: '0.85rem' }}></i>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Category Buttons & Searchbar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Search Bar & Result Counter */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search product by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.6rem',
                paddingRight: searchQuery ? '2.5rem' : '1rem',
                paddingTop: '0.65rem',
                paddingBottom: '0.65rem',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s',
                background: '#f9fafb'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>
            Showing <span style={{ color: '#d97706', fontWeight: 800 }}>{filteredProducts.length}</span> of {products.length} products
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
            Categories:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '20px',
              fontSize: '0.825rem',
              fontWeight: selectedCategory === 'all' ? 800 : 600,
              border: selectedCategory === 'all' ? '1px solid #111827' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: selectedCategory === 'all' ? '#111827' : '#f9fafb',
              color: selectedCategory === 'all' ? '#ffffff' : '#374151',
              boxShadow: selectedCategory === 'all' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            All Items ({products.length})
          </button>

          {categories.map(cat => {
            const catCount = products.filter(p => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  fontSize: '0.825rem',
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected ? '1px solid #d97706' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected ? '#fff7ed' : '#ffffff',
                  color: isSelected ? '#c2410c' : '#4b5563',
                  boxShadow: isSelected ? '0 2px 6px rgba(217, 119, 6, 0.15)' : 'none'
                }}
              >
                {cat.name} ({catCount})
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '16px', border: '1px dashed #d1d5db', margin: '1rem 0' }}>
          <div style={{ margin: '0 0 0.5rem', color: '#9ca3af' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.25rem' }}></i>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem' }}>No products found</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            No products match your search query or selected category filter.
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="btn-outline btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-mgmt-card">
              <div className="product-mgmt-img">
                <img
                  src={product.imageUrl || getCategoryDrinkImage(product.categoryId, product.name)}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getCategoryDrinkImage(product.categoryId, product.name);
                  }}
                />
                <span className="cat-tag">{product.categoryName}</span>
              </div>

              <div className="product-mgmt-body">
                <div className="product-mgmt-header">
                  <div>
                    <p className="product-mgmt-name">{product.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Type: {product.productType}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="product-mgmt-price">₱{product.price.toFixed(2)}</p>
                    {product.upsizePrice && (
                      <p style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>
                        22oz: ₱{product.upsizePrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="recipe-section">
                  <p className="recipe-label">RECIPE INGREDIENT DEDUCTIONS</p>
                  {product.recipes && product.recipes.length > 0 ? (
                    product.recipes.map((r, idx) => (
                      <div key={idx} className="recipe-row">
                        <span>• {r.inventoryItemName}</span>
                        <strong>{r.quantity} {r.unit}</strong>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>No recipe attached</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    className="btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                    onClick={() => handleOpenEdit(product)}
                  >
                    <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn-outline btn-sm"
                    style={{ color: '#ef4444', borderColor: '#fee2e2', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                    onClick={() => setArchiveTarget(product)}
                  >
                    <i className="fa-solid fa-box-archive" style={{ fontSize: '0.75rem' }}></i>
                    <span>Archive</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="receipt-modal" style={{ maxWidth: '550px' }}>
            <h2 className="card-title">{editingProduct ? 'Edit Product' : 'Add New Menu Item'}</h2>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spanish Latte"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Type</label>
                  <select
                    className="form-select"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as any)}
                  >
                    <option value="Drink">Drink</option>
                    <option value="Food">Food / Pastry</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Standard Price (₱)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                {productType === 'Drink' && (
                  <div className="form-group">
                    <label className="form-label">22oz Upsize Price (₱)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={upsizePrice}
                      onChange={(e) => setUpsizePrice(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Image URL or Import image
                  </label>
                  {imageUrl && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={13} /> Image Attached
                    </span>
                  )}
                </div>

                {/* Input row with URL field & Import Image button */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={imageUrl.startsWith('data:') ? (importedFileName ? `[File: ${importedFileName}]` : '[Imported Image File]') : imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImportedFileName('');
                      }}
                      placeholder="Paste image URL (https://...) or import file"
                      style={{
                        paddingRight: imageUrl ? '2.5rem' : '0.85rem',
                        fontStyle: imageUrl.startsWith('data:') ? 'italic' : 'normal',
                        color: imageUrl.startsWith('data:') ? '#4b5563' : '#111827',
                        background: imageUrl.startsWith('data:') ? '#f9fafb' : '#ffffff',
                        border: imageUrl ? '1.5px solid #ea580c' : '1px solid #d1d5db'
                      }}
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImportedFileName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        title="Clear image"
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    style={{ display: 'none' }}
                  />

                  {/* Import Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.95rem',
                      background: '#fff7ed',
                      border: '1.5px solid #ea580c',
                      color: '#ea580c',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: isCompressing ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <Upload size={16} />
                    {isCompressing ? 'Importing...' : 'Import Image'}
                  </button>
                </div>

                {/* Subtitle helper */}
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#9ca3af' }}></i>
                  <span>Upload JPG, PNG, WEBP from your computer, or paste a web URL.</span>
                </p>

                {/* Live Preview Box */}
                {imageUrl && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: '#fffcf7',
                      border: '1px solid #fed7aa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem'
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111827' }}>
                          Image Preview
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: imageUrl.startsWith('data:') ? '#dbeafe' : '#fef3c7',
                            color: imageUrl.startsWith('data:') ? '#1d4ed8' : '#b45309'
                          }}
                        >
                          {imageUrl.startsWith('data:') ? 'Imported Local File' : 'Web URL'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {importedFileName || (imageUrl.startsWith('data:') ? 'Custom uploaded image' : imageUrl)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          color: '#374151',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImportedFileName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipe builder */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Recipe Ingredients Mapping</label>
                  <button type="button" className="btn-outline btn-sm" onClick={handleAddRecipeRow}>
                    + Ingredient
                  </button>
                </div>

                {recipeItems.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      style={{ flex: 1 }}
                      value={r.inventoryItemId}
                      onChange={(e) => {
                        const updated = [...recipeItems];
                        updated[idx].inventoryItemId = e.target.value;
                        setRecipeItems(updated);
                      }}
                    >
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '90px' }}
                      value={r.quantity}
                      onChange={(e) => {
                        const updated = [...recipeItems];
                        updated[idx].quantity = Number(e.target.value);
                        setRecipeItems(updated);
                      }}
                      placeholder="Qty"
                    />

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: '4px', display: 'flex', alignItems: 'center' }}
                      onClick={() => handleRemoveRecipeRow(idx)}
                      title="Remove ingredient deduction"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="receipt-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1100, background: '#111827', color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            <span>{toastMessage}</span>
          </span>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="receipt-modal" style={{ maxWidth: '420px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.3rem' }}>
              <i className="fa-solid fa-box-archive"></i>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#111827' }}>Archive Product?</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.5rem', lineHeight: '1.4' }}>
              Are you sure you want to archive <strong>"{archiveTarget.name}"</strong>? It will be removed from the active menu and moved to the <strong>Archive Section</strong> where you can view or restore it anytime.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-outline" onClick={() => setArchiveTarget(null)} style={{ flex: 1, padding: '0.65rem' }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={executeArchiveProduct} style={{ flex: 1, padding: '0.65rem', background: '#dc2626', border: 'none' }}>
                Yes, Archive Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

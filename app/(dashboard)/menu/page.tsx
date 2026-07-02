'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Plus, Loader2, X, Pencil, Trash2, UtensilsCrossed, Leaf, Drumstick } from 'lucide-react'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/components/providers/ToastProvider'

interface Category { id: string; name: string; sortOrder: number; isActive: boolean }
interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  gstRate: number
  isVeg: boolean
  isAvailable: boolean
  categoryId: string | null
  sortOrder: number
}
interface CategoryWithItems extends Category { menuItems: MenuItem[] }

const GST_RATES = [0, 5, 12, 18, 28]

const emptyItem = { name: '', description: '', price: '', gstRate: '5', isVeg: true, categoryId: '' }
const emptyCat = { name: '' }

export default function MenuPage(): React.JSX.Element {
  const { confirm } = useConfirm()
  const toast = useToast()
  const [categories, setCategories] = useState<CategoryWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items')

  // Item form
  const [showItemForm, setShowItemForm] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [itemSaving, setItemSaving] = useState(false)
  const [itemError, setItemError] = useState('')

  // Category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState(emptyCat)
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMenu = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch('/api/menu')
      const data = (await res.json()) as { categories: CategoryWithItems[] }
      setCategories(data.categories ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchMenu() }, [fetchMenu])

  const allItems = categories.flatMap((c) => c.menuItems.map((i) => ({ ...i, categoryName: c.name })))

  function openAddItem(): void {
    setEditItemId(null); setItemForm(emptyItem); setItemError(''); setShowItemForm(true)
  }
  function openEditItem(item: MenuItem & { categoryName?: string }): void {
    setEditItemId(item.id)
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      gstRate: String(item.gstRate),
      isVeg: item.isVeg,
      categoryId: item.categoryId ?? '',
    })
    setItemError(''); setShowItemForm(true)
  }

  async function saveItem(): Promise<void> {
    if (!itemForm.name || !itemForm.price) { setItemError('Name and price required'); return }
    setItemSaving(true); setItemError('')
    try {
      const body = {
        name: itemForm.name,
        description: itemForm.description || null,
        price: Number(itemForm.price),
        gstRate: Number(itemForm.gstRate),
        isVeg: itemForm.isVeg,
        categoryId: itemForm.categoryId || null,
      }
      const res = await fetch(editItemId ? `/api/menu/${editItemId}` : '/api/menu', {
        method: editItemId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) { setItemError(data.error ?? 'Failed'); return }
      toast.success(editItemId ? 'Item updated' : 'Item added', itemForm.name)
      setShowItemForm(false); void fetchMenu()
    } finally { setItemSaving(false) }
  }

  async function toggleAvailable(item: MenuItem): Promise<void> {
    await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    })
    void fetchMenu()
  }

  async function deleteItem(id: string, name: string): Promise<void> {
    const ok = await confirm({ title: 'Delete Menu Item', message: `"${name}" will be permanently removed from the menu.`, confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    setDeletingId(id)
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' })
      toast.success('Item deleted', name)
      void fetchMenu()
    } finally { setDeletingId(null) }
  }

  function openAddCat(): void { setEditCatId(null); setCatForm(emptyCat); setCatError(''); setShowCatForm(true) }
  function openEditCat(cat: Category): void { setEditCatId(cat.id); setCatForm({ name: cat.name }); setCatError(''); setShowCatForm(true) }

  async function saveCat(): Promise<void> {
    if (!catForm.name) { setCatError('Name required'); return }
    setCatSaving(true); setCatError('')
    try {
      const res = await fetch(editCatId ? `/api/menu/categories/${editCatId}` : '/api/menu/categories', {
        method: editCatId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catForm.name }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) { setCatError(data.error ?? 'Failed'); return }
      toast.success(editCatId ? 'Category updated' : 'Category added', catForm.name)
      setShowCatForm(false); void fetchMenu()
    } finally { setCatSaving(false) }
  }

  async function deleteCat(id: string, name: string): Promise<void> {
    const ok = await confirm({ title: 'Delete Category', message: `"${name}" will be deleted. Items in it will become uncategorised.`, confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    setDeletingId(id)
    try {
      await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
      toast.success('Category deleted', name)
      void fetchMenu()
    } finally { setDeletingId(null) }
  }

  return (
    <div>
      <PageHeader title="Menu" subtitle="Manage menu items and categories" />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-1 w-fit">
        {(['items', 'categories'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all capitalize ${activeTab === tab ? 'bg-[rgb(var(--df-accent))] text-white' : 'text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" /></div>
      ) : activeTab === 'items' ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] text-[rgb(var(--df-text-2))]">{allItems.length} items across {categories.length} categories</p>
            <button onClick={openAddItem} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {/* Item form */}
          {showItemForm && (
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/30 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[14px]">{editItemId ? 'Edit Menu Item' : 'New Menu Item'}</h3>
                <button onClick={() => setShowItemForm(false)} className="text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text))]"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Item Name *</label>
                  <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Price (₹) *</label>
                  <input type="number" min="0" step="0.5" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Category</label>
                  <select value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]">
                    <option value="">Uncategorised</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">GST Rate (%)</label>
                  <select value={itemForm.gstRate} onChange={(e) => setItemForm({ ...itemForm, gstRate: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]">
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Type</label>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium border transition-all ${itemForm.isVeg ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-[rgb(var(--df-border))] text-[rgb(var(--df-text-3))]'}`}>
                      <Leaf className="w-3.5 h-3.5" /> Veg
                    </button>
                    <button onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium border transition-all ${!itemForm.isVeg ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-[rgb(var(--df-border))] text-[rgb(var(--df-text-3))]'}`}>
                      <Drumstick className="w-3.5 h-3.5" /> Non-Veg
                    </button>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Description</label>
                  <input value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]" />
                </div>
              </div>
              {itemError && <p className="text-[12px] text-red-400 mt-2">{itemError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => void saveItem()} disabled={itemSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium disabled:opacity-50 transition-all">
                  {itemSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Item
                </button>
                <button onClick={() => setShowItemForm(false)} className="px-4 py-2 text-[13px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">Cancel</button>
              </div>
            </div>
          )}

          {allItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
              </div>
              <p className="text-[14px] font-medium">No menu items yet</p>
              <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">Add items that your restaurant serves</p>
            </div>
          ) : (
            categories.map((cat) => cat.menuItems.length > 0 && (
              <div key={cat.id} className="mb-5">
                <h3 className="text-[12px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-2">{cat.name}</h3>
                <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
                  {cat.menuItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgb(var(--df-border))] last:border-b-0">
                      <div className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium ${!item.isAvailable ? 'text-[rgb(var(--df-text-3))] line-through' : 'text-[rgb(var(--df-text))]'}`}>{item.name}</p>
                        {item.description && <p className="text-[11px] text-[rgb(var(--df-text-3))] truncate">{item.description}</p>}
                      </div>
                      <span className="text-[12px] text-[rgb(var(--df-text-2))]">GST {item.gstRate}%</span>
                      <span className="text-[13px] font-semibold text-[rgb(var(--df-text))]">₹{item.price.toFixed(0)}</span>
                      <button onClick={() => void toggleAvailable(item)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${item.isAvailable ? 'border-green-500/30 text-green-400 bg-green-400/10' : 'border-[rgb(var(--df-border))] text-[rgb(var(--df-text-3))]'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => void deleteItem(item.id, item.name)} disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-400/10 text-[rgb(var(--df-text-3))] hover:text-red-400">
                        {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] text-[rgb(var(--df-text-2))]">{categories.length} categories</p>
            <button onClick={openAddCat} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {showCatForm && (
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/30 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[14px]">{editCatId ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setShowCatForm(false)} className="text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text))]"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-w-xs">
                <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Category Name *</label>
                <input value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })}
                  placeholder="e.g. Starters, Main Course, Beverages"
                  className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]" />
              </div>
              {catError && <p className="text-[12px] text-red-400 mt-2">{catError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => void saveCat()} disabled={catSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium disabled:opacity-50 transition-all">
                  {catSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                </button>
                <button onClick={() => setShowCatForm(false)} className="px-4 py-2 text-[13px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">Cancel</button>
              </div>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
              </div>
              <p className="text-[14px] font-medium">No categories yet</p>
            </div>
          ) : (
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3.5 border-b border-[rgb(var(--df-border))] last:border-b-0">
                  <div>
                    <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{cat.name}</p>
                    <p className="text-[11px] text-[rgb(var(--df-text-3))]">{cat.menuItems.length} item{cat.menuItems.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void deleteCat(cat.id, cat.name)} disabled={deletingId === cat.id}
                      className="p-1.5 rounded-lg hover:bg-red-400/10 text-[rgb(var(--df-text-3))] hover:text-red-400">
                      {deletingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

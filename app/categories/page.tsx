'use client'

import { useState, useEffect } from 'react'
import {
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from '@/actions/blog-categories'
import type { BlogCategory } from '@/types'

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  // Load categories when the page opens
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const data = await getBlogCategories()
    setCategories(data)
    setLoading(false)
  }

  // ---------- CREATE ----------
  const handleCreate = async () => {
    if (!newName.trim()) return

    const result = await createBlogCategory(newName)

    if (result.success) {
      setNewName('')
      loadCategories()
    } else {
      alert(result.error || 'Failed to create category')
    }
  }

  // ---------- UPDATE ----------
  const handleUpdate = async (id: number) => {
    const result = await updateBlogCategory(id, editName)

    if (result.success) {
      setEditingId(null)
      loadCategories()
    } else {
      alert(result.error || 'Failed to update category')
    }
  }

  // ---------- DELETE ----------
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return

    const result = await deleteBlogCategory(id)

    if (result.success) {
      loadCategories()
    } else {
      alert(result.error || 'Failed to delete category')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Blog Categories</h1>

      {/* Create New */}
      <div className="bg-zinc-900 p-6 rounded-3xl mb-8">
        <h2 className="text-xl mb-4">New Category</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category Name"
            className="flex-1 px-6 py-4 bg-black border border-zinc-700 rounded-2xl"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            className="px-8 py-4 bg-white text-black rounded-2xl font-medium"
          >
            Create
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-zinc-400">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-zinc-400">No categories yet.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-zinc-900 p-6 rounded-3xl flex justify-between items-center"
            >
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-6 py-3 bg-black border border-zinc-700 rounded-2xl mr-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                />
              ) : (
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-sm text-zinc-500">/{cat.slug}</p>
                </div>
              )}

              <div className="flex gap-3">
                {editingId === cat.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="text-green-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-zinc-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(cat.id)
                        setEditName(cat.name)
                      }}
                      className="text-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
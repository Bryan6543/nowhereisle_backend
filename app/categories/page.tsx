'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('blog_categories').select('*').order('name');
    setCategories(data || []);
  }

  const createCategory = async () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('blog_categories').insert({ name: newName.trim(), slug });
    if (!error) {
      setNewName('');
      fetchCategories();
    }
  };

  const updateCategory = async (id: number) => {
    const slug = editName.toLowerCase().replace(/\s+/g, '-');
    await supabase.from('blog_categories').update({ name: editName, slug }).eq('id', id);
    setEditingId(null);
    fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('blog_categories').delete().eq('id', id);
    fetchCategories();
  };

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
          />
          <button onClick={createCategory} className="px-8 py-4 bg-white text-black rounded-2xl font-medium">
            Create
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-zinc-900 p-6 rounded-3xl flex justify-between items-center">
            {editingId === cat.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-6 py-3 bg-black border border-zinc-700 rounded-2xl"
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
                  <button onClick={() => updateCategory(cat.id)} className="text-green-400">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-zinc-400">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="text-blue-400">Edit</button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-red-400">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
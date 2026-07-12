'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';

type Category = {
  id: number;
  name: string;
};

export default function NewBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('blog_categories').select('id, name').order('name');
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let thumbnailUrl = null;

    if (thumbnail) {
      const fileExt = thumbnail.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-thumbnails')
        .upload(fileName, thumbnail, { upsert: true });

      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message);
        setIsLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('blog-thumbnails').getPublicUrl(fileName);
      thumbnailUrl = publicUrl.publicUrl;
    }

    const { error: insertError } = await supabase.from('blogs').insert([{
      title,
      content,
      thumbnail_url: thumbnailUrl,
      category_id: categoryId,
    }]);

    if (insertError) {
      setError(insertError.message);
    } else {
      alert('Blog created successfully!');
      router.push('/isle_dashboard/lore_wisdom');
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Create New Blog</h1>

      {error && <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-2xl text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium mb-2">Thumbnail Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-zinc-400 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:bg-white file:text-black hover:file:bg-zinc-200"
          />
          {thumbnailPreview && (
            <div className="mt-4 relative w-full h-64 rounded-3xl overflow-hidden border border-zinc-800">
              <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl focus:outline-none focus:border-white"
          >
            <option value="">No Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl focus:outline-none focus:border-white text-lg"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">Content (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl focus:outline-none focus:border-white resize-y font-mono"
            required
          />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="px-8 py-3 border border-zinc-700 rounded-2xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-white text-black rounded-2xl font-medium disabled:opacity-50"
          >
            {isLoading ? 'Publishing...' : 'Publish Blog'}
          </button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import Image from 'next/image';

type Category = {
  id: number;
  name: string;
};

export default function EditBlog() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      // Fetch blog
      const { data: blogData } = await supabase.from('blogs').select('*').eq('id', id).single();
      
      // Fetch categories
      const { data: catData } = await supabase.from('blog_categories').select('id, name').order('name');

      if (blogData) {
        setTitle(blogData.title);
        setContent(blogData.content);
        setCurrentThumbnail(blogData.thumbnail_url);
        setCategoryId(blogData.category_id);
      }
      setCategories(catData || []);
      setIsFetching(false);
    }
    fetchData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewThumbnail(file);
      setNewPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let finalThumbnail = currentThumbnail;

    if (newThumbnail) {
      const fileName = `${Date.now()}-${newThumbnail.name}`;
      const { error: uploadError } = await supabase.storage
        .from('blog-thumbnails')
        .upload(fileName, newThumbnail, { upsert: true });

      if (uploadError) {
        setError('Upload failed: ' + uploadError.message);
        setIsLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('blog-thumbnails').getPublicUrl(fileName);
      finalThumbnail = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        title,
        content,
        thumbnail_url: finalThumbnail,
        category_id: categoryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      alert('Updated successfully!');
      router.push('/blogs');
    }
    setIsLoading(false);
  };

  if (isFetching) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Edit Blog</h1>

      {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-2xl">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thumbnail */}
        <div>
          <label className="block mb-2 text-sm font-medium">Thumbnail</label>
          {(currentThumbnail || newPreview) && (
            <div className="relative w-full h-64 mb-4 rounded-3xl overflow-hidden border border-zinc-700">
              <Image src={newPreview || currentThumbnail!} alt="thumbnail" fill className="object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl"
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
          <label className="block mb-2 text-sm font-medium">Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl" 
            required 
          />
        </div>

        {/* Content */}
        <div>
          <label className="block mb-2 text-sm font-medium">Content</label>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows={16} 
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl font-mono" 
            required 
          />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="px-8 py-3 border border-zinc-700 rounded-2xl">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-8 py-3 bg-white text-black rounded-2xl font-medium">
            {isLoading ? 'Updating...' : 'Update Blog'}
          </button>
        </div>
      </form>
    </div>
  );
}
// app/isle_dashboard/lore_wisdom/page.tsx
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';

async function getBlogs() {
  const { data, error } = await supabase
    .from('blogs')
    .select(`
      *,
      blog_categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }

  return data || [];
}

export default async function BlogsPage() {
  const blogs = await getBlogs();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Lore Wisdom - Blogs</h1>
          <p className="text-zinc-400 mt-2">Manage your blog posts</p>
        </div>

        <div className="flex gap-4">
          <Link 
            href="/categories"
            className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-2xl transition-colors"
          >
            Manage Categories
          </Link>
          <Link 
            href="/isle_dashboard/lore_wisdom/new"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-medium hover:bg-zinc-200 transition-colors"
          >
            New Blog Post
          </Link>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-800">
          <p className="text-zinc-400">No blogs yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {blogs.map((blog: any) => (
            <div key={blog.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              <div className="w-full md:w-72 h-64 md:h-48 flex-shrink-0 relative bg-zinc-800">
                {blog.thumbnail_url ? (
                  <Image 
                    src={blog.thumbnail_url} 
                    alt={blog.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                    No thumbnail
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 py-6 pr-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold pr-4">{blog.title}</h2>
                    {blog.blog_categories && (
                      <span className="inline-block mt-2 text-xs px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                        {blog.blog_categories.name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 whitespace-nowrap pt-1">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div 
                  className="text-zinc-400 line-clamp-3 mb-8 text-[15px]"
                  dangerouslySetInnerHTML={{ __html: blog.content?.substring(0, 280) + '...' || '' }}
                />

                <div className="flex gap-3">
                  <Link 
                    href={`/blogs/${blog.id}/edit`}
                    className="px-6 py-2.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-2xl transition-colors"
                  >
                    Edit
                  </Link>

                  <form action={async () => {
                    'use server';
                    const { error } = await supabase.from('blogs').delete().eq('id', blog.id);
                    if (!error) revalidatePath('/isle_dashboard/lore_wisdom');
                  }}>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 text-sm border border-red-900 hover:bg-red-950 text-red-400 rounded-2xl transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
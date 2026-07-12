"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Artwork = {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  category: string;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCatForUpload, setSelectedCatForUpload] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const backendUrl = "http://localhost:3001";

  const fetchData = async () => {
    setLoading(true);
    try {
      const artUrl =
        selectedCategory === "All"
          ? `${backendUrl}/api/artworks`
          : `${backendUrl}/api/artworks?category=${selectedCategory}`;

      const [artRes, catRes] = await Promise.all([
        fetch(artUrl),
        fetch(`${backendUrl}/api/categories`),
      ]);

      const artData = artRes.ok ? await artRes.json() : [];
      const catData = catRes.ok ? await catRes.json() : [];

      setArtworks(artData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, refreshTrigger]);

  const uploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedCatForUpload || !file)
      return alert("Please fill required fields");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", selectedCatForUpload);
    formData.append("description", description);

    try {
      const res = await fetch(`${backendUrl}/api/artworks`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Artwork uploaded!");
        setTitle("");
        setDescription("");
        setFile(null);
        setSelectedCatForUpload("");
        setRefreshTrigger((p) => p + 1);
      }
    } catch (err) {
      alert("Upload failed");
    }
    setUploading(false);
  };

  const deleteArtwork = async (id: string) => {
    if (!confirm("Delete this artwork?")) return;
    await fetch(`${backendUrl}/api/artworks/${id}`, { method: "DELETE" });
    setRefreshTrigger((p) => p + 1);
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}" and all associated artworks?`))
      return;

    await fetch(`${backendUrl}/api/categories/${id}`, { method: "DELETE" });
    setRefreshTrigger((p) => p + 1);
  };

  return (
    <div className="flex flex-col gap-10 p-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Artworks</h1>
        <p className="text-zinc-400 mt-2">Manage your artworks</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Add New Artwork Form */}
        <div className="p-8 rounded-3xl shadow mb-12">
          <h2 className="text-2xl font-semibold mb-6">Add New Artwork</h2>
          <form onSubmit={uploadArtwork} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  placeholder="Artwork Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  value={selectedCatForUpload}
                  onChange={(e) => setSelectedCatForUpload(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 h-24"
                placeholder="Optional description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-black text-white px-10 py-4 rounded-2xl font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              {uploading ? "Uploading..." : "Upload Artwork"}
            </button>
          </form>
        </div>

        {/* Categories Section */}
        <div className="p-8 rounded-3xl shadow mb-12">
          <div className="flex flex-col gap-4 items-center mb-6">
            <h2 className="text-2xl font-semibold">Categories</h2>
            <button
              onClick={async () => {
                const name = prompt("New category name:");
                if (name?.trim()) {
                  await fetch(`${backendUrl}/api/categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim() }),
                  });
                  setRefreshTrigger((p) => p + 1);
                }
              }}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              + New Category
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 border-white/20 border px-5 py-2 rounded-2xl"
              >
                <span className="font-medium">{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.id, cat.name)}
                  className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Artworks */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">All Artworks</h2>

        <div className="flex flex-wrap gap-3 mb-8">
          {["All", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-white/5 border"
                  : "bg-black text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12">Loading artworks...</p>
        ) : artworks.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No artworks found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((art) => (
              <div
                key={art.id}
                className="border border-white/20 rounded-3xl overflow-hidden shadow"
              >
                <Image
                  src={art.image_url}
                  alt={art.title}
                  width={500}
                  height={500}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5">
                  <h3 className="font-semibold">{art.title}</h3>
                  <p className="text-gray-500 text-sm">{art.description}</p>
                  <p className="text-sm text-gray-500 pt-2">{art.category}</p>

                  <button
                    onClick={() => deleteArtwork(art.id)}
                    className="mt-4 text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

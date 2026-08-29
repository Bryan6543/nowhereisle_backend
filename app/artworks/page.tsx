"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artwork, Category } from "@/types";

// Action Files 
import { getArtworks, createArtwork, deleteArtwork } from "@/actions/artworks";
import { getCategories, createCategory, deleteCategory } from "@/actions/categories";

export default function AdminArtworks() {
  // ---------- STATE (UI only) ----------
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCatForUpload, setSelectedCatForUpload] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---------- LOAD DATA ----------
  // This function now calls Server Actions instead of fetch()
  const loadData = async () => {
    setLoading(true);
    try {
      const [artData, catData] = await Promise.all([
        getArtworks(selectedCategory),
        getCategories(),
      ]);

      setArtworks(artData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Load data when the page opens or when the selected category changes
  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  // ---------- UPLOAD ARTWORK ----------
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !selectedCatForUpload || !file) {
      return alert("Please fill required fields");
    }

    setUploading(true);

    // Create FormData and send it to the Server Action
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", selectedCatForUpload);
    formData.append("description", description);

    const result = await createArtwork(formData);

    if (result.success) {
      alert("Artwork uploaded!");
      // Clear the form
      setTitle("");
      setDescription("");
      setFile(null);
      setSelectedCatForUpload("");
      // Reload the list
      loadData();
    } else {
      alert(result.error || "Upload failed");
    }

    setUploading(false);
  };

  // ---------- DELETE ARTWORK ----------
  const handleDeleteArtwork = async (id: string) => {
    if (!confirm("Delete this artwork?")) return;

    const result = await deleteArtwork(id);
    if (result.success) {
      loadData(); // refresh the list
    } else {
      alert(result.error || "Failed to delete");
    }
  };

  // ---------- CREATE CATEGORY ----------
  const handleCreateCategory = async () => {
    const name = prompt("New category name:");
    if (!name?.trim()) return;

    const result = await createCategory(name);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Failed to create category");
    }
  };

  // ---------- DELETE CATEGORY ----------
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}" and all associated artworks?`)) return;

    const result = await deleteCategory(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Failed to delete category");
    }
  };

  // ---------- UI (almost the same as before) ----------
  return (
    <div className="flex flex-col gap-10 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Artworks</h1>
          <p className="text-zinc-400 mt-2">Manage your artworks</p>
        </div>
        <div className="flex gap-4">
          {/* <Link
            href="/"
            className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-2xl transition-colors"
          >
            Manage Categories
          </Link> */}
          <Link
            href="/artworks/new"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-medium hover:bg-zinc-200 transition-colors"
          >
            New Artwork
          </Link>
        </div></div>

      {/* Artworks List */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">All Artworks</h2>

        <div className="flex flex-wrap gap-3 mb-8">
          {["All", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all ${selectedCategory === cat
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
                    onClick={() => handleDeleteArtwork(art.id)}
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
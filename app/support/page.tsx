// app/isle_dashboard/support/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: number;
  report_type: string;
  game_report_type: string | null;
  subject: string;
  description: string;
  email: string | null;
  status: string;
  created_at: string;
};

export default function SupportAdminPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    try {
      const { data, error } = await supabase
        .from("support_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from("support_inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setInquiries(prev =>
        prev.map(i => (i.id === id ? { ...i, status: newStatus } : i))
      );
    }
  };

  const filteredInquiries = inquiries
    .filter(i => {
      if (filter === "all") return true;
      return i.status === filter;
    })
    .filter(i =>
      i.subject.toLowerCase().includes(search.toLowerCase()) ||
      (i.email && i.email.toLowerCase().includes(search.toLowerCase()))
    );

  if (loading) return <div className="p-8 text-center">Loading support inquiries...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Support Inquiries</h1>
          <p className="text-zinc-400 mt-2">Manage user messages and reports</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search subject or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 flex-1 focus:outline-none focus:border-zinc-600"
        />

        <div className="flex gap-2">
          {["all", "new", "in_progress", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition ${
                filter === status
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
              }`}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Subject</th>
              <th className="px-6 py-5">Email</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredInquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-6">
                  <div className="capitalize">
                    {inquiry.report_type}
                    {inquiry.game_report_type && ` • ${inquiry.game_report_type}`}
                  </div>
                </td>
                <td className="px-6 py-6 font-medium">{inquiry.subject}</td>
                <td className="px-6 py-6 text-sm text-zinc-400">
                  {inquiry.email || <span className="italic opacity-50">No email</span>}
                </td>
                <td className="px-6 py-6 text-sm text-zinc-400">
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-6">
                  <select
                    value={inquiry.status}
                    onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td className="px-6 py-6 text-center">
                  <button
                    onClick={() => alert(`Description:\n\n${inquiry.description}`)}
                    className="text-blue-400 hover:text-blue-500 text-sm font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInquiries.length === 0 && (
          <p className="text-center py-20 text-zinc-500">No inquiries found.</p>
        )}
      </div>
    </div>
  );
}
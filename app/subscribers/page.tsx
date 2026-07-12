"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import SubscribersTable from "./SubscribersTable";

type Subscriber = {
  id: number;
  email: string;
  note: string | null;
  created_at: string;
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        setError(null);
        const { data, error, count: total } = await supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase Error:", error);
          setError(error.message);
          return;
        }

        setSubscribers(data || []);
        setCount(total || 0);
      } catch (err: any) {
        console.error("Failed to fetch:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribers();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading subscribers...</div>;

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        Error: {error}<br />
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Newsletter Subscribers</h1>
          <p className="text-zinc-400 mt-2">
            Total Subscribers: <span className="text-white font-semibold">{count}</span>
          </p>
        </div>
      </div>

      <SubscribersTable initialSubscribers={subscribers} totalCount={count} />
    </div>
  );
}
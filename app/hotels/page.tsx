import NavBar from "@/components/nav-bar";
import HotelGrid from "@/components/hotel-grid";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HotelsPage() {
  const { data: hotels } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white">Hotel Directory</h1>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Browse hotels with AI-powered guest assistants. Click to start
            chatting instantly.
          </p>
        </div>

        <HotelGrid hotels={hotels ?? []} />
      </main>
    </div>
  );
}

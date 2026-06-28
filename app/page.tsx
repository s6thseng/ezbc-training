import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data, error } = await supabase.from("weeks").select("id").limit(1);

  const isConnected = !error && data !== null;

  return (
    <main>
      <section className="card">
        <h1>🏸 EZBC Training</h1>
        <p>Training schedule and availability for EZBC badminton.</p>

        {isConnected ? (
          <p className="status success">Connected to Supabase ✅</p>
        ) : (
          <p className="status error">
            Connection failed ❌
            <br />
            {error?.message}
          </p>
        )}
      </section>
    </main>
  );
}

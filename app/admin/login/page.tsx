import { loginAdmin } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main>
      <section className="card">
        <h1>Admin login</h1>

        {error && <p className="status error">Wrong password.</p>}

        <form action={loginAdmin}>
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}

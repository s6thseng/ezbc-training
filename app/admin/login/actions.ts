"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password"));

  if (password !== process.env.ADMIN_SECRET) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();

  cookieStore.set("ezbc-admin", password, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}


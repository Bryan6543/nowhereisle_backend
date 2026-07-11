import { redirect } from "next/navigation";


export default function page() {
  redirect("/blogs");
}

export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";

export default function PanelLoginRedirect() {
  redirect("/auth/login");
}

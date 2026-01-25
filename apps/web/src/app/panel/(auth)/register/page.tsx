import { redirect } from "next/navigation";

export default function PanelRegisterRedirect() {
  redirect("/auth/register");
}

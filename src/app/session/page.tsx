import { redirect } from "next/navigation";

// Sessions now run via the Synapt browser extension.
// Anyone navigating directly to /session is sent to the dashboard.
export default function SessionPage() {
  redirect("/dashboard");
}

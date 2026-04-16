import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download | Synapt",
  description:
    "Add the Synapt Chrome extension and start tracking your focus in under a minute. Real-time drift detection that runs silently while you work.",
};

export default function DownloadPage() {
  return <DownloadClient />;
}

import type { Metadata } from "next";
import ResearchClient from "./ResearchClient";

export const metadata: Metadata = {
  title: "Research | Synapt",
  description:
    "The neuroscience and academic research behind how Synapt detects attention drift and restores focus. Built on decades of cognitive science.",
};

export default function ResearchPage() {
  return <ResearchClient />;
}

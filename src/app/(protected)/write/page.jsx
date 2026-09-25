"use client";

import { useSearchParams } from "next/navigation";
import ArticleEditor from "@/app/components/editor/ArticleEditor";

export default function CreatePage() {
  // Older links used /write?id=<draftId>; /write/<id> is the canonical form.
  const draftId = useSearchParams().get("id");
  return <ArticleEditor key={draftId || "new"} articleId={draftId} />;
}

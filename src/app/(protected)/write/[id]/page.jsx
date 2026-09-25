"use client";

import { useParams } from "next/navigation";
import ArticleEditor from "@/app/components/editor/ArticleEditor";

export default function EditCreatePage() {
  const { id } = useParams();
  return <ArticleEditor key={id} articleId={id} />;
}

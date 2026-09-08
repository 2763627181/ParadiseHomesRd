import "server-only";

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";


export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  authorName: string;
  readMinutes: number | null;
  publishedAt: string | null;
}

export interface BlogPost extends BlogPostSummary {
  body: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SUMMARY_COLS = "id, slug, title, excerpt, cover_image_url, category, author_name, read_minutes, published_at";
const FULL_COLS = `${SUMMARY_COLS}, body, tags, status, created_at, updated_at`;

function mapSummary(r: any): BlogPostSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? null,
    coverImageUrl: r.cover_image_url ?? null,
    category: r.category ?? null,
    authorName: r.author_name ?? "Equipo Paradise",
    readMinutes: r.read_minutes ?? null,
    publishedAt: r.published_at ?? null,
  };
}
function mapFull(r: any): BlogPost {
  return {
    ...mapSummary(r),
    body: r.body ?? "",
    tags: r.tags ?? [],
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const isMissingTable = (msg: string) => /does not exist|relation .* does not exist/i.test(msg);

/** Artículos publicados (portada del blog). */
export async function getPublishedPosts(): Promise<BlogPostSummary[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SUMMARY_COLS)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) {
    if (!isMissingTable(error.message)) console.error("[getPublishedPosts]", error.message);
    return [];
  }
  return (data ?? []).map(mapSummary);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_posts").select(FULL_COLS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapFull(data);
}

export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("blog_posts").select("slug").eq("status", "PUBLISHED").limit(500);
  if (error) return [];
  return (data ?? []).map((r: any) => r.slug as string);
}

/* ── admin ─────────────────────────────────────────────────────────────── */

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("blog_posts")
    .select(FULL_COLS)
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) {
    if (!isMissingTable(error.message)) console.error("[getAllPostsAdmin]", error.message);
    return [];
  }
  return (data ?? []).map(mapFull);
}

export async function getPostByIdAdmin(id: string): Promise<BlogPost | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("blog_posts").select(FULL_COLS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapFull(data);
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { formatDateRd } from "@paradise/utils/datetime";

import { getPostBySlug, getPublishedSlugs } from "@/lib/data/blog";
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/seo";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/blog/markdown";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublishedSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: post.coverImageUrl ? { images: [post.coverImageUrl] } : undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <Container size="narrow" className="py-10 lg:py-14">
      <JsonLd
        data={[
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        Blog
      </Link>

      <article>
        <header className="mb-6">
          {post.category && (
            <Badge variant="secondary" className="mb-3">
              {post.category}
            </Badge>
          )}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {post.authorName}
            {post.publishedAt ? ` · ${formatDateRd(post.publishedAt)}` : ""}
            {post.readMinutes ? ` · ${post.readMinutes} min de lectura` : ""}
          </p>
        </header>

        {post.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image src={post.coverImageUrl} alt="" fill sizes="720px" className="object-cover" priority />
          </div>
        )}

        {post.excerpt && (
          <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}

        <Markdown content={post.body} />

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </article>
    </Container>
  );
}

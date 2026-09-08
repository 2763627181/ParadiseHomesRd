import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatDateRd } from "@paradise/utils/datetime";

import { getPublishedPosts } from "@/lib/data/blog";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog y guías",
  description:
    "Guías para comprar, invertir, alquilar y financiar propiedades en República Dominicana. Consejos del equipo de Paradise Homes RD.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <Container className="py-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Blog y guías</h1>
        <p className="mt-2 text-muted-foreground">
          Comprar, invertir, alquilar y financiar en República Dominicana, explicado sin rodeos.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-sm font-medium">Todavía no hay artículos publicados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Estamos preparando contenido de calidad. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-border"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                {post.category && (
                  <Badge variant="secondary" className="mb-2 w-fit text-[0.7rem]">
                    {post.category}
                  </Badge>
                )}
                <h2 className="line-clamp-2 font-medium">{post.title}</h2>
                {post.excerpt && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                )}
                <p className="mt-auto pt-3 text-xs text-muted-foreground">
                  {post.publishedAt ? formatDateRd(post.publishedAt) : ""}
                  {post.readMinutes ? ` · ${post.readMinutes} min` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

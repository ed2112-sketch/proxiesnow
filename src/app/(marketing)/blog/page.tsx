import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — ProxiesNow",
  description: "News, tips, and updates from ProxiesNow.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Blog</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {posts.length === 0 && (
              <p className="text-center text-gray-500">No posts yet. Check back soon!</p>
            )}
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-gray-100 pb-8">
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-navy hover:text-accent">
                    {post.title}
                  </h2>
                </Link>
                <p className="mt-1 text-sm text-gray-500">{post.date}</p>
                <p className="mt-3 text-gray-600">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

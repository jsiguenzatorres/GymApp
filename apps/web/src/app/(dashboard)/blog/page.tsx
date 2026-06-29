import { serverFetch } from '@/lib/server-api';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { BlogEditor } from './blog-editor';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
}

async function deleteAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await serverFetch(`/api/v1/admin/blog/${id}`, { method: 'DELETE' });
  revalidatePath('/blog');
  redirect('/blog');
}

async function togglePublishAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const isPublished = formData.get('is_published') === 'true';
  await serverFetch(`/api/v1/admin/blog/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_published: !isPublished }),
  });
  revalidatePath('/blog');
  redirect('/blog');
}

async function createOrUpdateAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string | null;
  const payload = {
    title: formData.get('title') as string,
    excerpt: (formData.get('excerpt') as string) || undefined,
    content_md: formData.get('content_md') as string,
    cover_url: (formData.get('cover_url') as string) || undefined,
    author_name: (formData.get('author_name') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    tags: ((formData.get('tags') as string) || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    is_published: formData.get('is_published') === 'on',
  };

  if (id) {
    await serverFetch(`/api/v1/admin/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } else {
    await serverFetch('/api/v1/admin/blog', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  revalidatePath('/blog');
  redirect('/blog');
}

export default async function BlogPage() {
  const posts = (await serverFetch<BlogPost[]>('/api/v1/admin/blog')) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📰 Blog del gym</h1>
        <p className="text-sm text-gray-500">
          Publica artículos, tips de entrenamiento, recetas o noticias para tus miembros.
        </p>
      </div>

      <BlogEditor onSubmit={createOrUpdateAction} />

      {/* Lista */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </h2>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            Sin posts aún. Crea el primero arriba.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {posts.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
              >
                {p.cover_url && (
                  <div
                    className="h-32 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${p.cover_url})` }}
                  />
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {p.category && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {p.category}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.is_published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.is_published ? '✓ Publicado' : '✏️ Borrador'}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">👁️ {p.views_count}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{p.title}</h3>
                  {p.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.excerpt}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    /blog/{p.slug} ·{' '}
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString('es-SV')
                      : 'sin publicar'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <form action={togglePublishAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="is_published"
                        value={p.is_published ? 'true' : 'false'}
                      />
                      <button
                        type="submit"
                        className={`rounded px-3 py-1 text-xs font-semibold ${
                          p.is_published
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {p.is_published ? 'Despublicar' : 'Publicar'}
                      </button>
                    </form>
                    <form action={deleteAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

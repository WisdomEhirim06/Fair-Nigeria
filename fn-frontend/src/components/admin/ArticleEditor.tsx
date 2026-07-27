'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  ApiError,
  createArticle,
  deleteArticle,
  setArticlePublished,
  updateArticle,
  type Article,
  type ArticleCategory,
} from '@/lib/api';
import { CATEGORY_ORDER, categoryLabel } from '@/components/content/categories';
import { Markdown } from '@/components/content/Markdown';
import {
  Badge,
  Field,
  Modal,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
} from '@/components/admin/ui';

const BODY_PLACEHOLDER = `Write in Markdown.

## A heading

A paragraph with **bold**, *italic*, and a [link](https://example.com).

- A list item
- Another item

> A note worth pulling out.`;

export function ArticleEditor({ article }: { article?: Article }) {
  const router = useRouter();
  const editing = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? '');
  const [category, setCategory] = useState<ArticleCategory>(article?.category ?? 'voter_rights');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const [published, setPublished] = useState(article?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const ready = title.trim().length >= 3 && body.trim().length >= 1;

  async function save() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    setField(null);
    try {
      if (article) {
        await updateArticle(article.id, {
          title: title.trim(),
          category,
          body,
          excerpt: excerpt.trim() ? excerpt.trim() : null,
        });
      } else {
        await createArticle({
          title: title.trim(),
          category,
          body,
          excerpt: excerpt.trim() || undefined,
          slug: slug.trim() || undefined,
        });
      }
      router.push('/admin/articles');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setField(err.field ?? null);
      } else {
        setError('Could not save the article. Try again.');
      }
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!article) return;
    try {
      const updated = await setArticlePublished(article.id, !published);
      setPublished(updated.isPublished);
    } catch {
      /* leave state as-is; the badge reflects the last known value */
    }
  }

  async function remove() {
    if (!article) return;
    try {
      await deleteArticle(article.id);
      router.push('/admin/articles');
    } catch {
      setRemoving(false);
    }
  }

  return (
    <div>
      <a href="/admin/articles" className="mb-5 inline-flex text-[0.85rem] font-medium text-muted transition-colors hover:text-ink">
        Articles
      </a>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[clamp(1.4rem,4vw,2rem)] font-extrabold tracking-[-0.03em]">
            {editing ? 'Edit article' : 'New article'}
          </h1>
          {editing ? (
            <Badge tone={published ? 'positive' : 'warning'}>{published ? 'Published' : 'Draft'}</Badge>
          ) : null}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void togglePublish()} className={btnGhost}>
              {published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => setRemoving(true)}
              className="rounded-full px-3 py-2.5 text-[0.85rem] font-semibold text-error/80 transition-colors hover:bg-error/10"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <Field label="Title" error={field === 'title' ? error : null}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How accreditation works" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as ArticleCategory)}>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </Field>

          {!editing ? (
            <Field label="Slug (optional)" hint="Leave blank to generate from the title." error={field === 'slug' ? error : null}>
              <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="how-accreditation-works" />
            </Field>
          ) : (
            <Field label="Web address">
              <input className={inputClass} value={`/articles/${article?.slug ?? ''}`} disabled readOnly />
            </Field>
          )}
        </div>

        <Field label="Excerpt (optional)" hint="A one-line summary shown on cards and at the top of the article.">
          <input className={inputClass} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} />
        </Field>

        {/* Body — write / preview */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.82rem] font-medium text-ink/80">Body</span>
            <div className="flex rounded-lg border border-ink/15 p-0.5">
              {(['write', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 text-[0.78rem] font-semibold capitalize transition-colors ${
                    tab === t ? 'bg-ink text-cream' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tab === 'write' ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={BODY_PLACEHOLDER}
              rows={18}
              className="w-full resize-y rounded-xl border border-ink/15 bg-white p-4 font-mono text-[0.88rem] leading-relaxed text-ink outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/20"
            />
          ) : (
            <div className="min-h-[20rem] rounded-xl border border-ink/15 bg-white px-5 py-2">
              {body.trim() ? (
                <Markdown source={body} />
              ) : (
                <p className="py-16 text-center text-[0.9rem] text-muted">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        {error && !field ? (
          <p className="rounded-lg bg-error/10 px-4 py-3 text-[0.85rem] font-medium text-error">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <button type="button" onClick={() => void save()} disabled={!ready || saving} className={btnPrimary}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create article'}
          </button>
          <a href="/admin/articles" className={btnGhost}>
            Cancel
          </a>
        </div>
      </div>

      {removing ? (
        <Modal title="Delete article" onClose={() => setRemoving(false)}>
          <p className="text-[0.9rem] leading-relaxed text-muted">
            Permanently delete <span className="font-semibold text-ink">{article?.title}</span>? This
            can’t be undone — the deletion is recorded in the audit trail.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex items-center justify-center rounded-full bg-error px-4 py-2.5 text-[0.85rem] font-semibold text-cream transition hover:opacity-90"
            >
              Delete permanently
            </button>
            <button type="button" onClick={() => setRemoving(false)} className={btnGhost}>
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

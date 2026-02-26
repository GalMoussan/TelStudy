'use client';
import { useState, useRef } from 'react';
import { Button, ErrorBanner } from '@/components/ui';
import { validateQuestionFile } from '@/lib/validators/question-schema';
import { useQueryClient } from '@tanstack/react-query';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrors([]);

    const result = await validateQuestionFile(selected);
    if (!result.valid) {
      setErrors(result.errors);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (!name.trim()) {
      setErrors(['Set name is required']);
      return;
    }
    if (errors.length > 0) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('file', file);

    const res = await fetch('/api/question-sets', { method: 'POST', body: formData });
    setIsSubmitting(false);

    if (!res.ok) {
      const body = (await res.json()) as { error: { message?: string } };
      setErrors([body.error?.message ?? 'Upload failed']);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['question-sets'] });
    setName('');
    setFile(null);
    setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload question set"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 font-mono text-base font-semibold text-[var(--text)]">
          Upload Question Set
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <ErrorBanner key={i} message={err} />
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Set Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Hooks Questions"
              required
              className="w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">JSON File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              required
              data-testid="file-input"
              className="w-full text-sm text-[var(--muted)] file:mr-3 file:border-0 file:bg-[var(--surface)] file:px-3 file:py-1 file:text-xs file:text-[var(--text)]"
            />
            {file && errors.length === 0 && (
              <p className="mt-1 text-xs text-[var(--muted)]">{file.name} — valid</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || !file || errors.length > 0}
              data-testid="upload-submit-btn"
            >
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

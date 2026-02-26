'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { UploadModal } from './UploadModal';

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Upload
      </Button>
      <UploadModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

import React from 'react';
import CoverUploader from './CoverUploader';

interface CoverUploaderNewProps {
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  previewUrl?: string;
}

export default function CoverUploaderNew(props: CoverUploaderNewProps) {
  return <CoverUploader {...props} />;
}
"use client";

import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface FileUploadProps {
  label: string;
  onFilesChange?: (files: File[]) => void;
}

export const FileUpload = ({ label, onFilesChange }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const updateFiles = (nextFiles: File[]) => {
    setFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-brand-900">{label}</label>
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Upload files
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => updateFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => updateFiles(files.filter((item) => item.name !== file.name))}
                  className="text-neutral-500 hover:text-neutral-900"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

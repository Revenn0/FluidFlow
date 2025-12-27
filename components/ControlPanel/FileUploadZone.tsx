import React, { useRef } from 'react';
import { Upload, FileImage, Palette, X } from 'lucide-react';

interface FileUploadZoneProps {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  variant: 'sketch' | 'brand';
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  file,
  preview,
  onFileSelect,
  onRemove,
  variant
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const isSketch = variant === 'sketch';

  if (isSketch) {
    return (
      <div className="flex-none flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
            <FileImage className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
            Source Sketch
          </label>
          {file && (
            <span className="text-[10px] px-2 py-0.5 rounded-full animate-in fade-in zoom-in duration-300" style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
              Uploaded
            </span>
          )}
        </div>

        <div
          onClick={() => !file && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="group relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden"
          style={{
            borderColor: file ? 'var(--color-info-border)' : 'var(--theme-border)',
            backgroundColor: file ? 'var(--color-info-subtle)' : 'transparent',
            cursor: file ? 'default' : 'pointer'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
          />

          {file ? (
            <div className="relative w-full h-full p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              {preview && preview.trim() ? (
                <div className="relative w-full h-full rounded-lg overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-300" style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-glass-100)' }}>
                  <img src={preview} alt="Sketch preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <FileImage className="w-8 h-8" style={{ color: 'var(--color-info)' }} />
              )}

              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full transition-all z-20 shadow-lg"
                style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                title="Remove Image"
                aria-label="Remove sketch image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-full group-hover:scale-110 transition-all mb-2 shadow-xl" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
                <Upload className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
              </div>
              <p className="text-xs font-medium transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
                Drag sketch here
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Brand variant (compact)
  return (
    <div className="flex-none flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
          <Palette className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
          Brand Identity{' '}
          <span className="text-[10px] font-normal uppercase ml-1 tracking-wider px-1.5 rounded" style={{ color: 'var(--theme-text-dim)', border: '1px solid var(--theme-border-light)' }}>
            Optional
          </span>
        </label>
        {file && (
          <span className="text-[10px] px-2 py-0.5 rounded-full animate-in fade-in zoom-in" style={{ color: 'var(--color-feature)', backgroundColor: 'var(--color-feature-subtle)', border: '1px solid var(--color-feature-border)' }}>
            Active
          </span>
        )}
      </div>

      <div
        onClick={() => !file && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative h-12 rounded-lg border border-dashed flex items-center transition-all cursor-pointer overflow-hidden"
        style={{
          borderColor: file ? 'var(--color-feature-border)' : 'var(--theme-border)',
          backgroundColor: file ? 'var(--color-feature-subtle)' : 'transparent'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />

        {file ? (
          <div className="w-full h-full flex items-center justify-between px-3 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {preview && preview.trim() ? (
                <div className="w-8 h-8 rounded flex-none overflow-hidden" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border)' }}>
                  <img src={preview} alt="Brand" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-feature-subtle)' }}>
                  <Palette className="w-4 h-4" style={{ color: 'var(--color-feature)' }} />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--theme-text-secondary)' }}>{file.name}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--theme-text-dim)' }}
              aria-label="Remove brand image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 transition-colors" style={{ color: 'var(--theme-text-dim)' }}>
            <Upload className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Upload Logo / Style Guide</span>
          </div>
        )}
      </div>
    </div>
  );
};

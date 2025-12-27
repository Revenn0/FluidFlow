import React, { useRef } from 'react';
import { Image, Palette, X, Check } from 'lucide-react';
import { ChatAttachment } from '../../types';

interface UploadCardsProps {
  attachments: ChatAttachment[];
  onAttach: (type: 'sketch' | 'brand', file: File, preview: string) => void;
  onRemove: (type: 'sketch' | 'brand') => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadCards: React.FC<UploadCardsProps> = ({
  attachments,
  onAttach,
  onRemove,
  onError,
  disabled
}) => {
  const sketchInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);

  const sketchAttachment = attachments.find(a => a.type === 'sketch');
  const brandAttachment = attachments.find(a => a.type === 'brand');

  const handleFileSelect = (type: 'sketch' | 'brand', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      onError?.('File too large. Max 10MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError?.('Invalid file type. Use PNG, JPEG, or WebP.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Only attach if we got a valid result (not empty string)
      if (result && result.trim().length > 0) {
        onAttach(type, file, result);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleDrop = (type: 'sketch' | 'brand', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate
    if (file.size > MAX_FILE_SIZE) {
      onError?.('File too large. Max 10MB.');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError?.('Invalid file type. Use PNG, JPEG, or WebP.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Only attach if we got a valid result (not empty string)
      if (result && result.trim().length > 0) {
        onAttach(type, file, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      {/* Sketch/Mockup Upload */}
      <div
        className={`relative group rounded-xl border-2 border-dashed transition-all overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        style={{
          borderColor: sketchAttachment ? 'var(--color-info-border)' : 'var(--theme-border)',
          backgroundColor: sketchAttachment ? 'var(--color-info-subtle)' : 'var(--theme-glass-100)'
        }}
        onClick={() => !sketchAttachment && sketchInputRef.current?.click()}
        onDrop={(e) => handleDrop('sketch', e)}
        onDragOver={handleDragOver}
      >
        {sketchAttachment ? (
          <>
            {sketchAttachment.preview && sketchAttachment.preview.trim() ? (
              <img
                src={sketchAttachment.preview}
                alt="Sketch"
                className="w-full h-24 object-cover"
              />
            ) : (
              <div className="w-full h-24 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                <Image className="w-10 h-10" style={{ color: 'var(--color-info)' }} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info)' }}>
                  <Check className="w-3 h-3" style={{ color: 'var(--theme-text-primary)' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>Sketch</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove('sketch');
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'var(--color-error)' }}
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-primary)' }} />
              </button>
            </div>
          </>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-2 p-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-info-subtle)', border: '1px solid var(--color-info-border)' }}>
              <Image className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Sketch / Mockup</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>Drop or click</p>
            </div>
          </div>
        )}

        <input
          ref={sketchInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => handleFileSelect('sketch', e)}
          className="hidden"
        />
      </div>

      {/* Brand Logo Upload */}
      <div
        className={`relative group rounded-xl border-2 border-dashed transition-all overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        style={{
          borderColor: brandAttachment ? 'var(--color-feature-border)' : 'var(--theme-border)',
          backgroundColor: brandAttachment ? 'var(--color-feature-subtle)' : 'var(--theme-glass-100)'
        }}
        onClick={() => !brandAttachment && brandInputRef.current?.click()}
        onDrop={(e) => handleDrop('brand', e)}
        onDragOver={handleDragOver}
      >
        {brandAttachment ? (
          <>
            <div className="w-full h-24 flex items-center justify-center p-2" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
              {brandAttachment.preview && brandAttachment.preview.trim() ? (
                <img
                  src={brandAttachment.preview}
                  alt="Brand"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Palette className="w-10 h-10" style={{ color: 'var(--color-feature)' }} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-feature)' }}>
                  <Check className="w-3 h-3" style={{ color: 'var(--theme-text-primary)' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>Brand</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove('brand');
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'var(--color-error)' }}
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-primary)' }} />
              </button>
            </div>
          </>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-2 p-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-feature-subtle)', border: '1px solid var(--color-feature-border)' }}>
              <Palette className="w-5 h-5" style={{ color: 'var(--color-feature)' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Brand Logo</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>Optional</p>
            </div>
          </div>
        )}

        <input
          ref={brandInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => handleFileSelect('brand', e)}
          className="hidden"
        />
      </div>
    </div>
  );
};

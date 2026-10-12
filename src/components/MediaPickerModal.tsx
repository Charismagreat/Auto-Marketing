'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  RefreshCw,
  Sparkles,
  Camera,
  FolderOpen,
  HardDrive,
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  mime_type: string;
  url: string;
  size_bytes: number;
  created_at: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  acceptTypes?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = '내 매장 실물 사진 / 영상 선택',
  acceptTypes = 'image/*',
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [totalBytes, setTotalBytes] = useState(1517000);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 미디어 목록 로드
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.success) {
        setMediaList(data.media || []);
        if (data.total_bytes !== undefined) {
          setTotalBytes(data.total_bytes);
        }
        if (data.media?.length > 0 && !selectedUrl) {
          setSelectedUrl(data.media[0].url);
        }
      }
    } catch (err) {
      console.error('Fetch media error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  // 파일 업로드 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type.startsWith('video') ? 'video' : 'image',
            mime_type: file.type,
            url: base64Url,
            size_bytes: file.size,
          }),
        });
        const data = await res.json();
        if (data.success && data.media) {
          setMediaList((prev) => [data.media, ...prev]);
          setSelectedUrl(data.media.url);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setUploading(false);
    }
  };

  // 미디어 삭제
  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 미디어를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Delete media error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">이지데스크 로컬 보안 스토리지 연동</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>사용량: {(totalBytes / (1024 * 1024)).toFixed(2)} MB / 5 GB</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* 업로드 드롭존 영역 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={acceptTypes}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-indigo-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-bold">이지데스크 스토리지로 업로드 중...</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-indigo-400">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                </div>
                <p className="text-[11px] text-slate-400">
                  스마트폰으로 직접 촬영한 카스테라/매장 사진 (JPG, PNG, WebP)
                </p>
              </>
            )}
          </div>

          {/* 스토리지 보관 미디어 그리드 */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>내 매장 스토리지 미디어 ({mediaList.length}개)</span>
              </span>
              <button
                onClick={fetchMedia}
                disabled={loading}
                className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                스토리지 미디어 목록 불러오는 중...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {mediaList.map((item) => {
                  const isSelected = selectedUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedUrl(item.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition group ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-400 shadow-md'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                        <span className="text-[10px] text-white truncate block">
                          {item.name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDeleteMedia(item.id, e)}
                        className="absolute top-2 left-2 p-1 rounded-lg bg-black/60 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400 truncate max-w-sm">
            {selectedUrl ? '선택된 미디어로 콘텐츠를 즉시 변경합니다.' : '사용할 미디어를 선택해 주세요.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelect(selectedUrl);
                  onClose();
                }
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>이 사진으로 교체 적용</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

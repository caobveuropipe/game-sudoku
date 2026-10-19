import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LogOut,
  AlertTriangle,
  Smartphone,
  Monitor,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  AdminUser,
  LayerComponent,
  LayerComponentType,
  MessageLayer,
  MessageSequence,
  QuizOption,
} from '../../types';
import {
  checkAdminAuth,
  fetchAdminConfig,
  fetchAdminDraft,
  loginWithGoogleCredential,
  loginWithGoogleAccessToken,
  logoutAdmin,
  publishAdminDraft,
  saveAdminDraft,
} from '../../services/api';
import { MessageViewer } from '../messages/MessageViewer';
import { MusicPlayer } from '../audio/MusicPlayer';

interface AdminDashboardProps {
  onBackToGame: () => void;
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '37756221918-fp4k2sm04mc7ep9jkmbjnocjstjnnn43.apps.googleusercontent.com';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToGame }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGsiRendered, setIsGsiRendered] = useState<boolean>(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Draft state
  const [draft, setDraft] = useState<MessageSequence | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusNotification({ text, type });
    setTimeout(() => {
      setStatusNotification(prev => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Check auth and load draft
  useEffect(() => {
    async function init() {
      setIsAuthLoading(true);
      try {
        const authRes = await checkAdminAuth();
        if (authRes.isAuthenticated && authRes.user) {
          setCurrentUser(authRes.user);
          await loadDraftData();
        }
      } catch (err: any) {
        console.error('Auth error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
    init();
  }, []);

  const loadDraftData = async () => {
    try {
      const data = await fetchAdminDraft();
      setDraft(data);
      if (data.layers.length > 0) {
        setSelectedLayerId(data.layers[0].id);
      }
    } catch (err: any) {
      notify('Không thể tải bản nháp: ' + err.message, 'error');
    }
  };

  // Official Google Sign-In with real GIS credential
  const handleGoogleSignIn = async (credential: string) => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await loginWithGoogleCredential(credential);
      if (res.success && res.user) {
        if (res.user.email.toLowerCase().trim() !== 'caobuivan@vccorp.vn') {
          throw new Error(`Tài khoản '${res.user.email}' không có quyền quản trị.`);
        }
        setCurrentUser(res.user);
        await loadDraftData();
        notify('Đăng nhập Google thành công với quyền Quản trị viên!', 'success');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Open real Google OAuth popup window
  const handleGooglePopupLogin = () => {
    setAuthError(null);

    // 1. Google Identity Services 2.0 OAuth2 Token Client (opens real Google popup window)
    if ((window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setAuthError('Đăng nhập Google bị hủy hoặc thất bại: ' + tokenResponse.error);
              return;
            }
            if (tokenResponse.access_token) {
              setIsAuthLoading(true);
              try {
                const res = await loginWithGoogleAccessToken(tokenResponse.access_token);
                if (res.success && res.user) {
                  if (res.user.email.toLowerCase().trim() !== 'caobuivan@vccorp.vn') {
                    throw new Error(`Tài khoản '${res.user.email}' không có quyền quản trị.`);
                  }
                  setCurrentUser(res.user);
                  await loadDraftData();
                  notify('Đăng nhập Google thành công với quyền Quản trị viên!', 'success');
                }
              } catch (err: any) {
                setAuthError(err.message || 'Lỗi xác thực');
              } finally {
                setIsAuthLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err: any) {
        console.warn('OAuth2 popup error, trying fallback:', err);
      }
    }

    // 2. Fallback to GIS ID prompt
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleSignIn(response.credential);
            }
          },
          auto_select: false,
        });
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err: any) {
        console.error('GIS prompt error:', err);
      }
    }

    setAuthError('Thư viện Google SDK đang tải. Vui lòng thử lại sau vài giây.');
  };

  // Initialize Google Identity Services button
  useEffect(() => {
    if (currentUser || isAuthLoading) return;

    let timer: any = null;
    const renderGsi = () => {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response.credential) {
                handleGoogleSignIn(response.credential);
              }
            },
            auto_select: false,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 320,
            });
            setIsGsiRendered(true);
          }
        } catch (e: any) {
          console.error('Error rendering Google Sign-In button:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      renderGsi();
    } else {
      timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          renderGsi();
        }
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentUser, isAuthLoading]);

  const handleLogout = async () => {
    await logoutAdmin();
    setCurrentUser(null);
    setDraft(null);
    notify('Đã đăng xuất', 'info');
  };

  // Currently active layer
  const activeLayer = draft?.layers.find(l => l.id === selectedLayerId) || draft?.layers[0];

  // Helper to mark changes
  const updateDraft = useCallback((updater: (prev: MessageSequence) => MessageSequence) => {
    setDraft(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  // Save draft
  const handleSaveDraft = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      await saveAdminDraft(draft);
      setHasUnsavedChanges(false);
      notify('Đã lưu bản nháp vào cơ sở dữ liệu thành công!', 'success');
    } catch (err: any) {
      notify('Lỗi lưu bản nháp: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish draft
  const handlePublish = async () => {
    if (!draft) return;
    const confirmPub = window.confirm(
      'Bạn có chắc chắn muốn xuất bản chuỗi lời nhắn này cho tất cả người chơi sau khi giải thắng Sudoku?'
    );
    if (!confirmPub) return;

    setIsPublishing(true);
    try {
      // Save draft first
      await saveAdminDraft(draft);
      // Publish
      const published = await publishAdminDraft();
      setDraft(published);
      setHasUnsavedChanges(false);
      notify('Đã xuất bản thành công! Người chơi thắng Sudoku sẽ xem được nội dung mới nhất.', 'success');
    } catch (err: any) {
      notify('Lỗi xuất bản: ' + err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Layer CRUD
  const handleAddLayer = () => {
    const newId = `layer-${Date.now().toString(36)}`;
    const newLayer: MessageLayer = {
      id: newId,
      title: `Màn mới ${(draft?.layers.length || 0) + 1}`,
      theme: 'amber',
      components: [
        {
          id: `title-${Date.now()}`,
          type: 'title',
          titleProps: { text: 'Tiêu đề màn mới', align: 'center', fontSize: 'lg' },
        },
        {
          id: `text-${Date.now()}`,
          type: 'text',
          textProps: { text: 'Nội dung thông điệp ý nghĩa gửi tới người chơi...', align: 'center' },
        },
        {
          id: `btn-${Date.now()}`,
          type: 'next_button',
          buttonProps: { label: 'Xem tiếp →' },
        },
      ],
    };

    updateDraft(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));
    setSelectedLayerId(newId);
    notify('Đã thêm một màn lời nhắn mới', 'info');
  };

  const handleDuplicateLayer = (layerId: string) => {
    if (!draft) return;
    const target = draft.layers.find(l => l.id === layerId);
    if (!target) return;

    const duplicatedId = `layer-${Date.now().toString(36)}`;
    const duplicatedLayer: MessageLayer = {
      ...JSON.parse(JSON.stringify(target)),
      id: duplicatedId,
      title: `${target.title} (Bản sao)`,
      components: target.components.map(c => ({
        ...JSON.parse(JSON.stringify(c)),
        id: `${c.type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 100)}`,
      })),
    };

    const targetIndex = draft.layers.findIndex(l => l.id === layerId);
    const newLayers = [...draft.layers];
    newLayers.splice(targetIndex + 1, 0, duplicatedLayer);

    updateDraft(prev => ({ ...prev, layers: newLayers }));
    setSelectedLayerId(duplicatedId);
    notify('Đã nhân bản màn thành công', 'info');
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!draft) return;
    if (draft.layers.length <= 1) {
      alert('Chuỗi lời nhắn cần ít nhất 1 màn.');
      return;
    }
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa "${draft.layers.find(l => l.id === layerId)?.title}"?`);
    if (!confirmDelete) return;

    const newLayers = draft.layers.filter(l => l.id !== layerId);
    updateDraft(prev => ({ ...prev, layers: newLayers }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(newLayers[0]?.id || null);
    }
    notify('Đã xóa màn lời nhắn', 'info');
  };

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!draft) return;
    const index = draft.layers.findIndex(l => l.id === layerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === draft.layers.length - 1) return;

    const newLayers = [...draft.layers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;

    updateDraft(prev => ({ ...prev, layers: newLayers }));
  };

  // Component CRUD inside active layer
  const handleAddComponent = (type: LayerComponentType) => {
    if (!activeLayer) return;
    const newCompId = `${type}-${Date.now().toString(36)}`;
    let newComp: LayerComponent;

    switch (type) {
      case 'title':
        newComp = {
          id: newCompId,
          type: 'title',
          titleProps: { text: 'Tiêu đề mới', align: 'center', fontSize: 'lg' },
        };
        break;
      case 'text':
        newComp = {
          id: newCompId,
          type: 'text',
          textProps: { text: 'Nhập nội dung đoạn văn tại đây...', align: 'center', style: 'normal' },
        };
        break;
      case 'image':
        newComp = {
          id: newCompId,
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
            caption: 'Mô tả hình ảnh',
            alt: 'Hình ảnh',
          },
        };
        break;
      case 'quiz':
        newComp = {
          id: newCompId,
          type: 'quiz',
          quizProps: {
            question: 'Bạn muốn tiếp tục câu chuyện theo hướng nào?',
            options: [
              { id: `opt-1-${Date.now()}`, label: 'Lựa chọn A: Rạng rỡ' },
              { id: `opt-2-${Date.now()}`, label: 'Lựa chọn B: Sâu lắng' },
            ],
          },
        };
        break;
      case 'next_button':
        newComp = {
          id: newCompId,
          type: 'next_button',
          buttonProps: { label: 'Xem tiếp →' },
        };
        break;
    }

    updateDraft(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === activeLayer.id ? { ...l, components: [...l.components, newComp] } : l
      ),
    }));
    notify('Đã thêm thành phần mới vào màn', 'info');
  };

  const handleDeleteComponent = (compId: string) => {
    if (!activeLayer) return;
    updateDraft(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === activeLayer.id
          ? { ...l, components: l.components.filter(c => c.id !== compId) }
          : l
      ),
    }));
  };

  const handleMoveComponent = (compId: string, direction: 'up' | 'down') => {
    if (!activeLayer) return;
    const comps = [...activeLayer.components];
    const index = comps.findIndex(c => c.id === compId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === comps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = comps[index];
    comps[index] = comps[targetIndex];
    comps[targetIndex] = temp;

    updateDraft(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === activeLayer.id ? { ...l, components: comps } : l)),
    }));
  };

  // Update specific component properties
  const updateComponent = (compId: string, modifier: (comp: LayerComponent) => LayerComponent) => {
    if (!activeLayer) return;
    updateDraft(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id !== activeLayer.id) return l;
        return {
          ...l,
          components: l.components.map(c => (c.id === compId ? modifier({ ...c }) : c)),
        };
      }),
    }));
  };

  // Find all broken branches in the entire draft
  const getBrokenBranches = () => {
    if (!draft) return [];
    const layerIds = new Set(draft.layers.map(l => l.id));
    const broken: Array<{ layerTitle: string; reason: string }> = [];

    draft.layers.forEach(l => {
      // check default next
      if (l.defaultNextLayerId && !layerIds.has(l.defaultNextLayerId)) {
        broken.push({
          layerTitle: l.title,
          reason: `Màn mặc định trỏ tới '#${l.defaultNextLayerId}' không tồn tại.`,
        });
      }
      // check quizzes
      l.components.forEach(c => {
        if (c.type === 'quiz' && c.quizProps) {
          c.quizProps.options.forEach(opt => {
            if (opt.targetLayerId && !layerIds.has(opt.targetLayerId)) {
              broken.push({
                layerTitle: l.title,
                reason: `Lựa chọn "${opt.label}" trỏ tới màn '#${opt.targetLayerId}' đã bị xóa.`,
              });
            }
          });
        }
        if (c.type === 'next_button' && c.buttonProps?.targetLayerId) {
          if (!layerIds.has(c.buttonProps.targetLayerId)) {
            broken.push({
              layerTitle: l.title,
              reason: `Nút "${c.buttonProps.label}" trỏ tới màn '#${c.buttonProps.targetLayerId}' đã bị xóa.`,
            });
          }
        }
      });
    });

    return broken;
  };

  const brokenBranches = getBrokenBranches();

  // If loading auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">Đang tải trang quản trị...</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGIN SCREEN FOR caobuivan@vccorp.vn
  // ==========================================
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-amber-200/80 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
          Khu Vực Quản Trị Hệ Thống
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-serif-display">
          Xác Thực Quản Trị Viên
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Trang quản trị được bảo vệ nghiêm ngặt ở phía máy chủ. Chỉ tài khoản email được chỉ định mới có quyền xem bản nháp, biên tập và xuất bản chuỗi lời nhắn.
        </p>

        {authError && (
          <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5 text-left shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed">{authError}</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {/* Official Google OAuth Sign In Button */}
          <div className="w-full flex flex-col items-center justify-center min-h-[46px] my-2">
            <button
              type="button"
              onClick={handleGooglePopupLogin}
              className="w-full max-w-[320px] py-3.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 font-semibold text-sm text-slate-700 flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>

            <div ref={googleBtnRef} className="hidden" />
          </div>

          <button
            type="button"
            onClick={onBackToGame}
            className="w-full mt-2 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại ván chơi Sudoku</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN ADMIN WORKSPACE
  // ==========================================
  return (
    <div className="w-full min-h-screen bg-stone-50 pb-12">
      {/* Toast Notification */}
      {statusNotification && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium flex items-center gap-2 max-w-sm backdrop-blur-md ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800'
              : statusNotification.type === 'error'
              ? 'bg-rose-50/95 border-rose-300 text-rose-800'
              : 'bg-white/95 border-amber-300 text-amber-900'
          }`}
        >
          {statusNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{statusNotification.text}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6 py-2.5">
        <div className="max-w-[1680px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onBackToGame}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trò chơi</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm sm:text-base">
                  Trình Biên Tập Lời Nhắn Bí Mật
                </span>
                {hasUnsavedChanges ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
                    Có thay đổi chưa lưu
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Đã lưu bản nháp
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400">
                Quản trị viên: <span className="font-mono text-stone-600">{currentUser.email}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <MusicPlayer />

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4 text-stone-500" />
              <span>Xem trước</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-xs font-semibold text-amber-900 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-600" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isPublishing ? 'Đang xuất bản...' : 'Xuất bản cho người chơi'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-400 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Warning if broken branches exist */}
      {brokenBranches.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col gap-1 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cảnh báo liên kết nhánh ({brokenBranches.length} lỗi):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-2">
              {brokenBranches.map((b, i) => (
                <li key={i}>
                  <strong>{b.layerTitle}:</strong> {b.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main 2-column or 3-column builder layout */}
      <main className="max-w-[1680px] w-full mx-auto px-3 sm:px-6 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ==========================================
            LEFT PANEL: LAYER LIST & REORDERING
            ========================================== */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs lg:sticky lg:top-16 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-sm">Danh Sách Màn</span>
                <span className="text-xs text-stone-400 font-mono">({draft?.layers.length || 0})</span>
              </div>
              <button
                type="button"
                onClick={handleAddLayer}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm màn</span>
              </button>
            </div>

            {/* List of layers */}
            <div className="flex flex-col gap-2">
              {draft?.layers.map((layer, index) => {
                const isSelected = layer.id === selectedLayerId;
                const hasQuiz = layer.components.some(c => c.type === 'quiz');

                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-amber-100 text-stone-600 group-hover:text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-800 truncate">
                          {layer.title}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-1">
                          <span>{layer.components.length} thành phần</span>
                          {hasQuiz && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold">
                              Có câu hỏi nhánh
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Move and duplicate controls */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleMoveLayer(layer.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-stone-200/70 disabled:opacity-20 text-stone-600"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleMoveLayer(layer.id, 'down');
                        }}
                        disabled={index === (draft?.layers.length || 0) - 1}
                        className="p-1 rounded hover:bg-stone-200/70 disabled:opacity-20 text-stone-600"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleDuplicateLayer(layer.id);
                        }}
                        className="p-1 rounded hover:bg-stone-200/70 text-stone-600"
                        title="Nhân bản màn này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteLayer(layer.id);
                        }}
                        className="p-1 rounded hover:bg-rose-100 text-rose-600"
                        title="Xóa màn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==========================================
            RIGHT PANEL: VISUAL LAYER CANVAS & INSPECTOR
            ========================================== */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          {activeLayer ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs flex flex-col gap-5">
              {/* Layer Title & Theme Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex-1 max-w-md">
                  <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                    Tên màn (Hiển thị trong quản trị):
                  </label>
                  <input
                    type="text"
                    value={activeLayer.title}
                    onChange={e => {
                      const newTitle = e.target.value;
                      updateDraft(prev => ({
                        ...prev,
                        layers: prev.layers.map(l =>
                          l.id === activeLayer.id ? { ...l, title: newTitle } : l
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* Theme selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Tông màu nền:
                    </label>
                    <select
                      value={activeLayer.theme}
                      onChange={e => {
                        const newTheme = e.target.value as any;
                        updateDraft(prev => ({
                          ...prev,
                          layers: prev.layers.map(l =>
                            l.id === activeLayer.id ? { ...l, theme: newTheme } : l
                          ),
                        }));
                      }}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-slate-700 bg-white"
                    >
                      <option value="amber">Ấm Áp (Hổ phách)</option>
                      <option value="rose">Dịu Ngọt (Hồng phấn)</option>
                      <option value="emerald">Bình Yên (Xanh ngọc)</option>
                      <option value="indigo">Trầm Lắng (Xanh chàm)</option>
                      <option value="warm">Cổ Điển (Giấy vàng mộc)</option>
                    </select>
                  </div>

                  {/* Device view switcher */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Xem theo thiết bị:
                    </label>
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1.5 rounded-md transition-colors ${
                          previewDevice === 'desktop' ? 'bg-white shadow-xs text-amber-700' : 'text-stone-500'
                        }`}
                        title="Xem chế độ Máy tính"
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1.5 rounded-md transition-colors ${
                          previewDevice === 'mobile' ? 'bg-white shadow-xs text-amber-700' : 'text-stone-500'
                        }`}
                        title="Xem chế độ Điện thoại"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Component Quick Toolbar */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <span className="text-xs font-bold text-stone-600 mr-1">Thêm thành phần:</span>
                <button
                  type="button"
                  onClick={() => handleAddComponent('title')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                >
                  <Type className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Tiêu đề</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddComponent('text')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Đoạn văn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddComponent('image')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Hình ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddComponent('quiz')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Câu hỏi trắc nghiệm</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddComponent('next_button')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Nút chuyển màn</span>
                </button>
              </div>

              {/* Visual Interactive Canvas */}
              <div
                className={`mx-auto w-full transition-all border border-stone-200 rounded-2xl bg-stone-50/50 p-3 sm:p-5 ${
                  previewDevice === 'mobile' ? 'max-w-[400px]' : 'max-w-4xl'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {activeLayer.components.map((comp, compIdx) => (
                    <div
                      key={comp.id}
                      className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 relative group hover:border-amber-400 transition-all"
                    >
                      {/* Component header & toolbar */}
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {comp.type === 'title'
                              ? 'Tiêu đề'
                              : comp.type === 'text'
                              ? 'Đoạn văn'
                              : comp.type === 'image'
                              ? 'Hình ảnh'
                              : comp.type === 'quiz'
                              ? 'Câu hỏi trắc nghiệm'
                              : 'Nút chuyển'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveComponent(comp.id, 'up')}
                            disabled={compIdx === 0}
                            className="p-1 rounded hover:bg-stone-100 disabled:opacity-20 text-stone-500"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveComponent(comp.id, 'down')}
                            disabled={compIdx === activeLayer.components.length - 1}
                            className="p-1 rounded hover:bg-stone-100 disabled:opacity-20 text-stone-500"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComponent(comp.id)}
                            className="p-1 rounded hover:bg-rose-50 text-rose-600"
                            title="Xóa thành phần này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Component Edit Fields */}
                      {comp.type === 'title' && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={comp.titleProps?.text || ''}
                            placeholder="Nhập tiêu đề..."
                            onChange={e =>
                              updateComponent(comp.id, c => ({
                                ...c,
                                titleProps: {
                                  ...(c.titleProps || { align: 'center', fontSize: 'lg' }),
                                  text: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-base font-bold text-slate-800 font-serif-display focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400">Căn lề:</span>
                              {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() =>
                                    updateComponent(comp.id, c => ({
                                      ...c,
                                      titleProps: { ...(c.titleProps || { text: '', fontSize: 'lg' }), align },
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    comp.titleProps?.align === align
                                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                      : 'bg-white border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400">Cỡ chữ:</span>
                              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() =>
                                    updateComponent(comp.id, c => ({
                                      ...c,
                                      titleProps: { ...(c.titleProps || { text: '', align: 'center' }), fontSize: size },
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    comp.titleProps?.fontSize === size
                                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                      : 'bg-white border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {size.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {comp.type === 'text' && (
                        <div className="flex flex-col gap-2">
                          <textarea
                            rows={3}
                            value={comp.textProps?.text || ''}
                            placeholder="Nhập nội dung đoạn văn..."
                            onChange={e =>
                              updateComponent(comp.id, c => ({
                                ...c,
                                textProps: {
                                  ...(c.textProps || { align: 'center', style: 'normal' }),
                                  text: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400">Căn lề:</span>
                              {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() =>
                                    updateComponent(comp.id, c => ({
                                      ...c,
                                      textProps: { ...(c.textProps || { text: '' }), align },
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    comp.textProps?.align === align
                                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                      : 'bg-white border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400">Kiểu dáng:</span>
                              {(['normal', 'italic', 'quote'] as const).map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    updateComponent(comp.id, c => ({
                                      ...c,
                                      textProps: { ...(c.textProps || { text: '', align: 'center' }), style: st },
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    comp.textProps?.style === st
                                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                      : 'bg-white border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {st === 'normal' ? 'Chuẩn' : st === 'italic' ? 'Nghiêng' : 'Trích dẫn'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {comp.type === 'image' && (
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] text-stone-400">Đường dẫn hình ảnh (URL):</label>
                          <input
                            type="text"
                            value={comp.imageProps?.url || ''}
                            placeholder="https://images.unsplash.com/..."
                            onChange={e =>
                              updateComponent(comp.id, c => ({
                                ...c,
                                imageProps: {
                                  ...(c.imageProps || { caption: '', alt: '' }),
                                  url: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-slate-800"
                          />
                          <input
                            type="text"
                            value={comp.imageProps?.caption || ''}
                            placeholder="Chú thích dưới ảnh (tùy chọn)..."
                            onChange={e =>
                              updateComponent(comp.id, c => ({
                                ...c,
                                imageProps: {
                                  ...(c.imageProps || { url: '', alt: '' }),
                                  caption: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-slate-700"
                          />
                          {comp.imageProps?.url && (
                            <div className="w-full max-h-36 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center mt-1">
                              <img
                                src={comp.imageProps.url}
                                alt="Xem trước"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {comp.type === 'quiz' && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                              Câu hỏi:
                            </label>
                            <input
                              type="text"
                              value={comp.quizProps?.question || ''}
                              placeholder="Nhập câu hỏi..."
                              onChange={e =>
                                updateComponent(comp.id, c => ({
                                  ...c,
                                  quizProps: {
                                    options: c.quizProps?.options || [],
                                    question: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          {/* Options and branch destination */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                Các lựa chọn & Nhánh rẽ:
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptId = `opt-${Date.now()}`;
                                  updateComponent(comp.id, c => ({
                                    ...c,
                                    quizProps: {
                                      question: c.quizProps?.question || '',
                                      options: [
                                        ...(c.quizProps?.options || []),
                                        { id: newOptId, label: `Lựa chọn ${(c.quizProps?.options.length || 0) + 1}` },
                                      ],
                                    },
                                  }));
                                }}
                                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
                              >
                                + Thêm lựa chọn
                              </button>
                            </div>

                            <div className="flex flex-col gap-2">
                              {comp.quizProps?.options.map((opt, optIdx) => {
                                const targetExists = !opt.targetLayerId || (draft?.layers || []).some(l => l.id === opt.targetLayerId);
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center gap-2 ${
                                      !targetExists ? 'border-rose-400 bg-rose-50/50' : 'border-stone-200 bg-stone-50/50'
                                    }`}
                                  >
                                    <input
                                      type="text"
                                      value={opt.label}
                                      placeholder="Nội dung lựa chọn..."
                                      onChange={e => {
                                        const val = e.target.value;
                                        updateComponent(comp.id, c => ({
                                          ...c,
                                          quizProps: {
                                            question: c.quizProps?.question || '',
                                            options: c.quizProps?.options.map(o =>
                                              o.id === opt.id ? { ...o, label: val } : o
                                            ) || [],
                                          },
                                        }));
                                      }}
                                      className="flex-1 w-full px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-slate-800"
                                    />

                                    {/* Branch Target Select */}
                                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                      <span className="text-[11px] text-stone-500 whitespace-nowrap">Dẫn tới:</span>
                                      <select
                                        value={opt.targetLayerId || ''}
                                        onChange={e => {
                                          const target = e.target.value || undefined;
                                          updateComponent(comp.id, c => ({
                                            ...c,
                                            quizProps: {
                                              question: c.quizProps?.question || '',
                                              options: c.quizProps?.options.map(o =>
                                                o.id === opt.id ? { ...o, targetLayerId: target } : o
                                              ) || [],
                                            },
                                          }));
                                        }}
                                        className="px-2 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-slate-700 min-w-[140px]"
                                      >
                                        <option value="">(Màn kế tiếp mặc định)</option>
                                        {(draft?.layers || []).map(l => (
                                          <option key={l.id} value={l.id}>
                                            {l.title}
                                          </option>
                                        ))}
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateComponent(comp.id, c => ({
                                            ...c,
                                            quizProps: {
                                              question: c.quizProps?.question || '',
                                              options: c.quizProps?.options.filter(o => o.id !== opt.id) || [],
                                            },
                                          }));
                                        }}
                                        className="p-1 rounded hover:bg-rose-100 text-rose-500"
                                        title="Xóa lựa chọn này"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {comp.type === 'next_button' && (
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="flex-1 w-full">
                            <label className="text-[11px] text-stone-400 block mb-1">Chữ trên nút:</label>
                            <input
                              type="text"
                              value={comp.buttonProps?.label || ''}
                              placeholder="Xem tiếp →"
                              onChange={e =>
                                updateComponent(comp.id, c => ({
                                  ...c,
                                  buttonProps: {
                                    ...(c.buttonProps || {}),
                                    label: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-slate-800"
                            />
                          </div>

                          <div className="w-full sm:w-auto">
                            <label className="text-[11px] text-stone-400 block mb-1">Dẫn tới màn:</label>
                            <select
                              value={comp.buttonProps?.targetLayerId || ''}
                              onChange={e =>
                                updateComponent(comp.id, c => ({
                                  ...c,
                                  buttonProps: {
                                    ...(c.buttonProps || { label: 'Xem tiếp →' }),
                                    targetLayerId: e.target.value || undefined,
                                  },
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-slate-700 min-w-[160px]"
                            >
                              <option value="">(Màn kế tiếp theo thứ tự)</option>
                              {(draft?.layers || []).map(l => (
                                <option key={l.id} value={l.id}>
                                  {l.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {activeLayer.components.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-sm">
                      Màn này chưa có thành phần nào. Hãy dùng thanh công cụ phía trên để thêm Tiêu đề, Văn bản hoặc Câu hỏi!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              Hãy chọn một màn từ danh sách bên trái để chỉnh sửa.
            </div>
          )}
        </div>
      </main>

      {/* ==========================================
          FULL INTERACTIVE PREVIEW MODAL
          ========================================== */}
      {isPreviewModalOpen && draft && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-amber-300">
            {/* Modal header */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  Xem Trước Trải Nghiệm Người Chơi
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold hidden sm:inline">
                  Bản Nháp
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-200/60">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      previewDevice === 'desktop' ? 'bg-white shadow-xs text-amber-700' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Máy tính</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      previewDevice === 'mobile' ? 'bg-white shadow-xs text-amber-700' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Điện thoại</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-3 py-1 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-stone-100/70 flex items-start justify-center">
              <MessageViewer
                sequence={draft}
                isPreview={true}
                previewDevice={previewDevice}
                onBackToSudoku={() => setIsPreviewModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  Heart,
  HelpCircle,
} from 'lucide-react';
import { MessageLayer, MessageSequence, QuizOption } from '../../types';
import { audioManager } from '../../utils/audio';

interface MessageViewerProps {
  sequence: MessageSequence;
  isPreview?: boolean;
  previewDevice?: 'desktop' | 'mobile';
  onBackToSudoku?: () => void;
}

export const MessageViewer: React.FC<MessageViewerProps> = ({
  sequence,
  isPreview = false,
  previewDevice = 'desktop',
  onBackToSudoku,
}) => {
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);
  const [historyTrail, setHistoryTrail] = useState<number[]>([]);
  const [selectedQuizChoices, setSelectedQuizChoices] = useState<Record<string, QuizOption>>({});
  const [quizError, setQuizError] = useState<string | null>(null);

  const layers = sequence.layers || [];
  const currentLayer: MessageLayer | undefined = layers[currentLayerIndex] || layers[0];

  // Helper to find layer index by ID
  const findLayerIndexById = (layerId?: string): number => {
    if (!layerId) return -1;
    return layers.findIndex(l => l.id === layerId);
  };

  // Find next layer based on quiz selection, explicit branch, or sequential
  const determineNextLayerIndex = (): number => {
    if (!currentLayer) return -1;

    // Check if current layer has a quiz
    const quizComp = currentLayer.components.find(c => c.type === 'quiz');
    if (quizComp) {
      const chosen = selectedQuizChoices[currentLayer.id];
      if (chosen && chosen.targetLayerId) {
        const branchIndex = findLayerIndexById(chosen.targetLayerId);
        if (branchIndex !== -1) return branchIndex;
      }
    }

    // Check if layer has a button with specific targetLayerId
    const buttonComp = currentLayer.components.find(c => c.type === 'next_button');
    if (buttonComp?.buttonProps?.targetLayerId) {
      const targetIndex = findLayerIndexById(buttonComp.buttonProps.targetLayerId);
      if (targetIndex !== -1) return targetIndex;
    }

    // Default next layer
    if (currentLayer.defaultNextLayerId) {
      const defaultIndex = findLayerIndexById(currentLayer.defaultNextLayerId);
      if (defaultIndex !== -1) return defaultIndex;
    }

    // Next sequential
    if (currentLayerIndex + 1 < layers.length) {
      return currentLayerIndex + 1;
    }

    return -1; // End reached
  };

  const handleNext = () => {
    if (!currentLayer) return;

    // Check if quiz is unanswered
    const quizComp = currentLayer.components.find(c => c.type === 'quiz');
    if (quizComp && !selectedQuizChoices[currentLayer.id]) {
      setQuizError('Vui lòng chọn một câu trả lời để tiếp tục!');
      return;
    }
    setQuizError(null);

    const nextIndex = determineNextLayerIndex();
    audioManager.playClick(1.2);
    if (nextIndex !== -1) {
      setHistoryTrail(prev => [...prev, currentLayerIndex]);
      setCurrentLayerIndex(nextIndex);
    } else {
      // Completed last layer
      audioManager.playVictoryFanfare();
      setCurrentLayerIndex(layers.length); // Out of bounds indicates completion screen
    }
  };

  const handleBack = () => {
    audioManager.playClick(0.85);
    if (historyTrail.length > 0) {
      const prevIndex = historyTrail[historyTrail.length - 1];
      setHistoryTrail(prev => prev.slice(0, -1));
      setCurrentLayerIndex(prevIndex);
      setQuizError(null);
    } else if (currentLayerIndex > 0) {
      setCurrentLayerIndex(currentLayerIndex - 1);
      setQuizError(null);
    }
  };

  const handleRestart = () => {
    audioManager.playClick(0.9);
    setCurrentLayerIndex(0);
    setHistoryTrail([]);
    setSelectedQuizChoices({});
    setQuizError(null);
  };

  const handleSelectQuizOption = (option: QuizOption) => {
    audioManager.playClick(1.1);
    if (!currentLayer) return;
    setSelectedQuizChoices(prev => ({
      ...prev,
      [currentLayer.id]: option,
    }));
    setQuizError(null);
  };

  // Color theme backgrounds
  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'rose':
        return 'from-rose-50 via-pink-50/40 to-amber-50/30 border-rose-100 text-rose-950';
      case 'amber':
        return 'from-amber-50 via-orange-50/30 to-yellow-50/20 border-amber-100 text-amber-950';
      case 'emerald':
        return 'from-emerald-50 via-teal-50/30 to-green-50/20 border-emerald-100 text-emerald-950';
      case 'indigo':
        return 'from-indigo-50 via-purple-50/30 to-slate-50/20 border-indigo-100 text-indigo-950';
      default:
        return 'from-amber-50/60 via-stone-50/80 to-amber-50/40 border-stone-200/80 text-stone-900';
    }
  };

  const isCompleted = currentLayerIndex >= layers.length;

  return (
    <div
      className={`w-full mx-auto transition-all ${
        previewDevice === 'mobile'
          ? 'max-w-[390px] border-4 border-slate-700 rounded-[38px] p-2 bg-slate-900 shadow-2xl my-2'
          : 'max-w-2xl w-full px-2 sm:px-4 py-2'
      }`}
    >
      <div
        className={`w-full rounded-2xl sm:rounded-3xl bg-white shadow-sm border border-stone-200 overflow-hidden relative flex flex-col ${
          previewDevice === 'mobile' ? 'min-h-[560px] max-h-[700px] rounded-[30px]' : 'min-h-[420px]'
        }`}
      >
        {/* Navigation & Progress Bar */}
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {historyTrail.length > 0 || currentLayerIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            ) : onBackToSudoku ? (
              <button
                type="button"
                onClick={onBackToSudoku}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về bàn cờ</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {layers.map((l, idx) => (
              <div
                key={`progress-dot-${l.id}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentLayerIndex
                    ? 'w-6 bg-amber-600'
                    : idx < currentLayerIndex
                    ? 'w-2 bg-amber-300'
                    : 'w-2 bg-stone-200'
                }`}
              />
            ))}
          </div>

          <div className="text-xs font-medium text-slate-500">
            {isCompleted ? 'Hoàn thành' : `Màn ${currentLayerIndex + 1}/${layers.length}`}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isCompleted && currentLayer ? (
              <motion.div
                key={`layer-${currentLayer.id}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`w-full rounded-xl sm:rounded-2xl bg-gradient-to-b p-4 sm:p-5 border ${getThemeClasses(
                  currentLayer.theme
                )} flex flex-col gap-3 shadow-xs`}
              >
                {/* Render Layer Components */}
                {currentLayer.components.map(comp => {
                  switch (comp.type) {
                    case 'title': {
                      const props = comp.titleProps || { text: 'Tiêu đề', align: 'center', fontSize: 'lg' };
                      const sizeClass =
                        props.fontSize === 'xl'
                          ? 'text-xl sm:text-2xl'
                          : props.fontSize === 'lg'
                          ? 'text-lg sm:text-xl'
                          : props.fontSize === 'md'
                          ? 'text-base sm:text-lg'
                          : 'text-sm sm:text-base';
                      const alignClass =
                        props.align === 'left' ? 'text-left' : props.align === 'right' ? 'text-right' : 'text-center';

                      return (
                        <h2
                          key={comp.id}
                          className={`font-bold font-serif-display leading-snug tracking-tight ${sizeClass} ${alignClass}`}
                        >
                          {props.text}
                        </h2>
                      );
                    }

                    case 'text': {
                      const props = comp.textProps || { text: '', align: 'center', style: 'normal' };
                      const alignClass =
                        props.align === 'left' ? 'text-left' : props.align === 'right' ? 'text-right' : 'text-center';
                      const styleClass =
                        props.style === 'italic'
                          ? 'italic text-stone-600'
                          : props.style === 'quote'
                          ? 'border-l-4 border-amber-400 pl-4 italic text-stone-700 my-1.5'
                          : 'text-stone-800';

                      return (
                        <p
                          key={comp.id}
                          className={`text-xs sm:text-sm leading-relaxed ${alignClass} ${styleClass} whitespace-pre-wrap`}
                        >
                          {props.text}
                        </p>
                      );
                    }

                    case 'image': {
                      const props = comp.imageProps;
                      if (!props?.url) return null;
                      return (
                        <div key={comp.id} className="w-full flex flex-col items-center my-0.5">
                          <div className="w-full max-w-sm sm:max-w-md max-h-48 sm:max-h-56 overflow-hidden rounded-xl shadow-xs border border-black/5 bg-stone-100 flex items-center justify-center">
                            <img
                              src={props.url}
                              alt={props.alt || 'Hình ảnh lời nhắn'}
                              className="w-full h-full max-h-48 sm:max-h-56 object-cover transition-transform duration-500 hover:scale-102"
                              onError={e => {
                                // Graceful fallback
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          {props.caption && (
                            <span className="text-[11px] text-stone-500 mt-1 italic text-center">
                              {props.caption}
                            </span>
                          )}
                        </div>
                      );
                    }

                    case 'quiz': {
                      const props = comp.quizProps;
                      if (!props) return null;
                      const currentSelected = selectedQuizChoices[currentLayer.id];

                      return (
                        <div
                          key={comp.id}
                          className="w-full my-2 p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-amber-200/60 shadow-xs"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1 rounded-lg bg-amber-100 text-amber-800">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm sm:text-base text-stone-900">
                              {props.question}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {props.options.map(option => {
                              const isSelected = currentSelected?.id === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => handleSelectQuizOption(option)}
                                  className={`w-full py-3 px-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                      : 'bg-white hover:bg-amber-50/60 border-stone-200 text-stone-800'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    case 'next_button': {
                      const props = comp.buttonProps || { label: 'Xem tiếp →' };
                      return (
                        <div key={comp.id} className="w-full pt-2 flex justify-center">
                          <button
                            type="button"
                            onClick={handleNext}
                            className="w-full sm:w-auto min-w-[200px] py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <span>{props.label}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }

                    default:
                      return null;
                  }
                })}

                {/* Validation error if quiz unanswered */}
                {quizError && (
                  <div className="text-xs font-medium text-rose-600 text-center py-1 animate-shake">
                    {quizError}
                  </div>
                )}

                {/* If layer doesn't include an explicit next_button component, provide default one */}
                {!currentLayer.components.some(c => c.type === 'next_button') && (
                  <div className="w-full pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full sm:w-auto min-w-[180px] py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Xem tiếp</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Completed Ending Screen */
              <motion.div
                key="completion-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50/40 p-6 sm:p-8 border border-amber-200/80 text-center flex flex-col items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                  <Heart className="w-7 h-7 text-amber-600 animate-pulse fill-amber-500" />
                </div>

                <h3 className="text-2xl font-bold font-serif-display text-stone-900">
                  Bạn Đã Xem Hết Lời Nhắn
                </h3>

                <p className="text-sm text-stone-600 max-w-md leading-relaxed">
                  Cảm ơn bạn đã đồng hành trọn vẹn qua từng màn cảm xúc và câu hỏi. Chúc bạn luôn giữ vững niềm vui, sự tự tin và nụ cười rạng rỡ mỗi ngày!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center max-w-sm">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-xs sm:text-sm text-stone-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-stone-500" />
                    <span>Đọc lại từ đầu</span>
                  </button>

                  {onBackToSudoku && (
                    <button
                      type="button"
                      onClick={onBackToSudoku}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Chơi ván Sudoku mới</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

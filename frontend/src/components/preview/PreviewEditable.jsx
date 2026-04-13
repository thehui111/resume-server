import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { polishText } from '../../api'
import { Sparkles, X, Check, Loader2 } from 'lucide-react'

const VARIANT_LABELS = ['专业精炼', '量化/结果导向', '生动有感染力']
const VARIANT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', active: 'border-blue-500 bg-blue-100', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', active: 'border-emerald-500 bg-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', active: 'border-amber-500 bg-amber-100', badge: 'bg-amber-100 text-amber-700' },
]

export default function PreviewEditable({
  value,
  onChange,
  editable = false,
  tag: Tag = 'span',
  className = '',
  ...rest
}) {
  const ref = useRef(null)
  const toolbarRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })
  const [toolbarText, setToolbarText] = useState('')
  const [polishState, setPolishState] = useState(null) // { selectedText, loading, variants, error }
  const [selectedVariant, setSelectedVariant] = useState(-1)

  // Keep DOM text in sync when value changes from outside
  useEffect(() => {
    if (ref.current && ref.current.textContent !== String(value ?? '')) {
      ref.current.textContent = String(value ?? '')
    }
  }, [value])

  const handlePolishClick = useCallback(() => {
    const text = toolbarText.trim()
    if (!text) return
    setShowToolbar(false)
    setPolishState({ selectedText: text, loading: true, variants: [], error: '' })
    setSelectedVariant(-1)

    polishText(text)
      .then(data => {
        setPolishState(prev => prev ? { ...prev, loading: false, variants: data.variants || [] } : null)
      })
      .catch(e => {
        setPolishState(prev => prev ? { ...prev, loading: false, error: e.message || '润色失败' } : null)
      })
  }, [toolbarText])

  const handleConfirm = useCallback(() => {
    if (!polishState || selectedVariant < 0) return
    const variant = polishState.variants[selectedVariant]
    if (!variant) return

    // Replace selected text in the current content
    const el = ref.current
    if (!el) return
    const currentText = el.textContent || ''
    const idx = currentText.indexOf(polishState.selectedText)
    if (idx !== -1) {
      const newText = currentText.substring(0, idx) + variant + currentText.substring(idx + polishState.selectedText.length)
      el.textContent = newText
      onChange?.(newText)
    } else {
      // Fallback: just set the variant
      el.textContent = variant
      onChange?.(variant)
    }
    setPolishState(null)
    setSelectedVariant(-1)
  }, [polishState, selectedVariant, onChange])

  useEffect(() => {
    if (!editable) return

    function handleMouseUp(e) {
      // 如果点击在 toolbar 上，不要隐藏它
      if (toolbarRef.current?.contains(e.target)) return
      const el = ref.current
      if (!el || !el.contains(e.target)) {
        setShowToolbar(false)
        setToolbarText('')
        return
      }
      setTimeout(() => {
        const sel = window.getSelection()
        const text = sel?.toString().trim()
        if (text && text.length > 0 && el.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          // Use fixed positioning based on viewport coordinates
          setToolbarPos({
            top: rect.top - 42,
            left: Math.max(8, Math.min(rect.left + rect.width / 2 - 50, window.innerWidth - 108)),
          })
          setToolbarText(text)
          setShowToolbar(true)
        } else {
          setShowToolbar(false)
          setToolbarText('')
        }
      }, 10)
    }

    function handleMouseDown(e) {
      if (!ref.current?.contains(e.target) && !toolbarRef.current?.contains(e.target)) {
        setShowToolbar(false)
        setToolbarText('')
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [editable])

  if (!editable) {
    return <Tag className={className} {...rest}>{String(value ?? '')}</Tag>
  }

  return (
    <>
      {showToolbar && !polishState && createPortal(
        <button
          ref={toolbarRef}
          onClick={handlePolishClick}
          onMouseDown={e => e.preventDefault()}
          className="fixed z-[9999] flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-lg px-2.5 py-1.5 hover:bg-gray-800 transition-colors"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium whitespace-nowrap">AI 润色</span>
        </button>,
        document.body
      )}

      <Tag
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          if (!polishState) onChange?.(e.currentTarget.textContent)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && Tag !== 'DIV' && Tag !== 'P' && Tag !== 'H1') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        className={
          `${className} outline-none border-b border-dashed border-transparent hover:border-indigo-300 focus:border-indigo-500 transition-colors cursor-text`.trim()
        }
        {...rest}
      >
        {String(value ?? '')}
      </Tag>

      {/* Polish Popup Portal */}
      {polishState && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setPolishState(null); setSelectedVariant(-1) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-semibold text-gray-900">AI 文本润色</h3>
              </div>
              <button onClick={() => { setPolishState(null); setSelectedVariant(-1) }} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Original */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">原文</span>
                <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {polishState.selectedText}
                </div>
              </div>

              {/* Variants */}
              {polishState.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-sm text-gray-500">AI 正在生成润色方案...</span>
                </div>
              ) : polishState.error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500">{polishState.error}</p>
                  <button onClick={() => { setPolishState(null); setSelectedVariant(-1) }} className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline">关闭</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">选择一个润色版本</span>
                  {polishState.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(i)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        selectedVariant === i ? VARIANT_COLORS[i].active : `${VARIANT_COLORS[i].bg} ${VARIANT_COLORS[i].border} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${VARIANT_COLORS[i].badge}`}>
                          版本 {i + 1} · {VARIANT_LABELS[i]}
                        </span>
                        {selectedVariant === i && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{v}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!polishState.loading && !polishState.error && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => { setPolishState(null); setSelectedVariant(-1) }} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">取消</button>
                <button onClick={handleConfirm} disabled={selectedVariant < 0} className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                  使用选中版本
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

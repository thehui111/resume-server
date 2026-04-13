import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { detailResume, updateResume, previewResume, listTemplates, saveSection } from '../api'
import DefaultTemplate from '../components/preview/DefaultTemplate'
import ClassicTemplate from '../components/preview/ClassicTemplate'
import CleanTemplate from '../components/preview/CleanTemplate'
import MinimalTemplate from '../components/preview/MinimalTemplate'
import ProfessionalTemplate from '../components/preview/ProfessionalTemplate'
import ModernTemplate from '../components/preview/ModernTemplate'
import CreativeTemplate from '../components/preview/CreativeTemplate'
import BasicInfo from '../components/sections/BasicInfo'
import Summary from '../components/sections/Summary'
import WorkExp from '../components/sections/WorkExp'
import Education from '../components/sections/Education'
import Skills from '../components/sections/Skills'
import Projects from '../components/sections/Projects'
import AiGenerateModal from '../components/modals/AiGenerateModal'
import JdOptimizeModal from '../components/modals/JdOptimizeModal'
import ExportModal from '../components/modals/ExportModal'

const SECTION_LIST = [
  { key: 'basic_info', label: '基本信息' },
  { key: 'summary', label: '个人总结' },
  { key: 'work_exp', label: '工作经历' },
  { key: 'education', label: '教育背景' },
  { key: 'skills', label: '技能' },
  { key: 'projects', label: '项目经历' },
]

const FRONTEND_TEMPLATES = new Set(['default.html', 'classic.html', 'clean.html', 'minimal.html', 'professional.html', 'modern.html', 'creative.html'])

const TEMPLATE_COMPONENTS = {
  'default.html': DefaultTemplate,
  'classic.html': ClassicTemplate,
  'clean.html': CleanTemplate,
  'minimal.html': MinimalTemplate,
  'professional.html': ProfessionalTemplate,
  'modern.html': ModernTemplate,
  'creative.html': CreativeTemplate,
}

export default function ResumeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const resumeId = parseInt(id)

  const [resume, setResume] = useState(null)
  const [sections, setSections] = useState({})
  const [activeKey, setActiveKey] = useState('basic_info')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [loading, setLoading] = useState(true)

  const [showAi, setShowAi] = useState(false)
  const [showJd, setShowJd] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const [showPreview, setShowPreview] = useState(true)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState('default.html')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewEditMode, setPreviewEditMode] = useState(false)
  const [templates, setTemplates] = useState([])
  const [splitPct, setSplitPct] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  useEffect(() => {
    detailResume(resumeId).then(data => {
      setResume(data)
      setTitleInput(data.title)
      const map = {}
      for (const s of data.sections) map[s.section_type] = s.content
      setSections(map)
      setLoading(false)
    })
  }, [resumeId])

  useEffect(() => {
    listTemplates().then(data => setTemplates(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!showPreview) return
    if (FRONTEND_TEMPLATES.has(previewTemplate)) {
      setPreviewHtml('')
      setPreviewLoading(false)
      return
    }
    setPreviewLoading(true)
    previewResume(resumeId, previewTemplate)
      .then(html => setPreviewHtml(html))
      .catch(() => {})
      .finally(() => setPreviewLoading(false))
  }, [showPreview, previewTemplate, resumeId])

  function onDividerMouseDown(e) {
    e.preventDefault()
    dragging.current = true
    function onMouseMove(e) {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.min(Math.max(pct, 20), 80))
    }
    function onMouseUp() {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function refreshPreview() {
    if (FRONTEND_TEMPLATES.has(previewTemplate)) return
    setPreviewLoading(true)
    previewResume(resumeId, previewTemplate)
      .then(html => setPreviewHtml(html))
      .catch(() => {})
      .finally(() => setPreviewLoading(false))
  }

  async function saveTitle() {
    setEditingTitle(false)
    if (titleInput !== resume.title) {
      await updateResume({ id: resumeId, title: titleInput })
      setResume(r => ({ ...r, title: titleInput }))
    }
  }

  function handleSectionSaved(type, content) {
    setSections(prev => ({ ...prev, [type]: content }))
    if (showPreview && !FRONTEND_TEMPLATES.has(previewTemplate)) refreshPreview()
  }

  // 弹窗回调：AI 生成/JD 优化的每个 section 实时更新
  function handleSectionFromModal(type, content) {
    setSections(prev => ({ ...prev, [type]: content }))
    if (showPreview && !FRONTEND_TEMPLATES.has(previewTemplate)) refreshPreview()
  }

  // ESC exits preview edit mode
  useEffect(() => {
    if (!previewEditMode) return
    function onKey(e) {
      if (e.key === 'Escape') setPreviewEditMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewEditMode])

  async function handlePreviewEdit(type, content) {
    setSections(prev => ({ ...prev, [type]: content }))
    try {
      await saveSection(resumeId, type, content, 0)
      // silently saved
    } catch (e) {
      // Optionally show toast; here we ignore
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  const existingSectionKeys = Object.keys(sections)
  const isFrontendPreview = FRONTEND_TEMPLATES.has(previewTemplate)
  const PreviewComponent = TEMPLATE_COMPONENTS[previewTemplate]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/resumes')} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
          {editingTitle ? (
            <input
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              className="border-b border-indigo-500 text-gray-900 font-semibold text-sm px-1 py-0.5 focus:outline-none w-56"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-gray-900 font-semibold text-sm hover:text-indigo-600 flex items-center gap-1"
            >
              {resume.title}
              <span className="text-gray-400 text-xs">✎</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAi(true)}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            ✨ AI 生成
          </button>
          <button
            onClick={() => setShowJd(true)}
            disabled={existingSectionKeys.length === 0}
            className="border border-indigo-300 text-indigo-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-40 transition-colors"
          >
            JD 优化
          </button>
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`border px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showPreview
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showPreview ? '关闭预览' : '实时预览'}
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            导出 PDF
          </button>
        </div>
      </header>

      {/* Body */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: sidebar + editor */}
        <div
          className="flex overflow-hidden flex-shrink-0"
          style={{ width: showPreview ? `${splitPct}%` : '100%' }}
        >
          {/* Sidebar */}
          <nav className="w-44 bg-white border-r border-gray-200 py-4 flex-shrink-0">
            {SECTION_LIST.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                  activeKey === key
                    ? 'bg-indigo-50 text-indigo-700 font-medium border-r-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  sections[key] ? 'bg-indigo-500' : 'bg-gray-300'
                }`} />
                {label}
              </button>
            ))}
          </nav>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className={`${showPreview ? '' : 'max-w-2xl mx-auto'} bg-white rounded-2xl border border-gray-200 p-6`}>
              {activeKey === 'basic_info' && (
                <BasicInfo resumeId={resumeId} data={sections.basic_info} onSaved={handleSectionSaved} />
              )}
              {activeKey === 'summary' && (
                <Summary resumeId={resumeId} data={sections.summary} onSaved={handleSectionSaved} />
              )}
              {activeKey === 'work_exp' && (
                <WorkExp resumeId={resumeId} data={sections.work_exp} onSaved={handleSectionSaved} />
              )}
              {activeKey === 'education' && (
                <Education resumeId={resumeId} data={sections.education} onSaved={handleSectionSaved} />
              )}
              {activeKey === 'skills' && (
                <Skills resumeId={resumeId} data={sections.skills} onSaved={handleSectionSaved} />
              )}
              {activeKey === 'projects' && (
                <Projects resumeId={resumeId} data={sections.projects} onSaved={handleSectionSaved} />
              )}
            </div>
          </main>
        </div>

        {/* Drag divider */}
        {showPreview && (
          <div
            onMouseDown={onDividerMouseDown}
            className="w-1 flex-shrink-0 bg-gray-200 hover:bg-indigo-400 cursor-col-resize transition-colors relative"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Right: live preview panel */}
        {showPreview && (
          <div className="flex flex-col bg-gray-100 overflow-hidden" style={{ width: `${100 - splitPct}%` }}>
            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 gap-2">
              <span className="text-sm font-medium text-gray-700">实时预览</span>
              <div className="flex items-center gap-2">
                <select
                  value={previewTemplate}
                  onChange={e => {
                    setPreviewTemplate(e.target.value)
                    setPreviewEditMode(false)
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:border-indigo-400"
                >
                  <option value="default.html">简约</option>
                  {templates.filter(t => t.file_name !== 'default.html' && !t.is_premium).map(t => (
                    <option key={t.file_name} value={t.file_name}>{t.name}</option>
                  ))}
                </select>

                {isFrontendPreview && (
                  <button
                    onClick={() => setPreviewEditMode(v => !v)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      previewEditMode
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {previewEditMode ? '退出编辑' : '编辑预览'}
                  </button>
                )}

                {!isFrontendPreview && (
                  <button
                    onClick={refreshPreview}
                    disabled={previewLoading}
                    className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    {previewLoading ? '刷新中...' : '刷新'}
                  </button>
                )}
              </div>
            </div>
            {/* Preview content */}
            <div className="flex-1 overflow-hidden relative">
              {previewLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <span className="text-sm text-gray-400">加载中...</span>
                </div>
              )}

              {isFrontendPreview && PreviewComponent ? (
                <div
                  className="w-full h-full overflow-auto bg-white relative"
                  data-preview-container
                  onDoubleClick={() => setPreviewEditMode(true)}
                >
                  {previewEditMode && (
                    <div className="sticky top-0 z-20 bg-indigo-600 text-white text-xs text-center py-1.5 font-medium">
                      编辑模式 — 点击文字直接修改，按 Esc 退出
                    </div>
                  )}
                  <PreviewComponent sections={sections} editable={previewEditMode} onEdit={handlePreviewEdit} />
                </div>
              ) : previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-none bg-white"
                  title="resume-preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  {previewLoading ? '' : '暂无预览内容'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAi && (
        <AiGenerateModal
          resumeId={resumeId}
          targetRole={resume.target_role}
          onSection={handleSectionFromModal}
          onClose={() => setShowAi(false)}
        />
      )}
      {showJd && (
        <JdOptimizeModal
          resumeId={resumeId}
          existingSections={existingSectionKeys}
          onSection={handleSectionFromModal}
          onClose={() => setShowJd(false)}
        />
      )}
      {showExport && (
        <ExportModal resumeId={resumeId} onClose={() => setShowExport(false)} />
      )}
    </div>
  )
}

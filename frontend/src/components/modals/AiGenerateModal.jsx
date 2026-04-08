import { useState } from 'react'
import { aiGenerateStream } from '../../api'
import { parseSSE } from '../../utils/sse'

const ALL_SECTIONS = ['basic_info', 'summary', 'work_exp', 'education', 'skills', 'projects']
const SECTION_LABEL = {
  basic_info: '基本信息',
  summary: '个人总结',
  work_exp: '工作经历',
  education: '教育背景',
  skills: '技能',
  projects: '项目经历',
}

export default function AiGenerateModal({ resumeId, targetRole: initRole, onSection, onClose }) {
  const [step, setStep] = useState('form') // form | generating | done
  const [form, setForm] = useState({ target_role: initRole || '', raw_info: '' })
  const [selectedSections, setSelectedSections] = useState(new Set(ALL_SECTIONS))
  const [progress, setProgress] = useState({}) // {section_type: 'done'|'loading'}
  const [error, setError] = useState('')

  function toggleSection(s) {
    setSelectedSections(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function parseRawInfo(text) {
    return { 经历描述: text }
  }

  async function handleGenerate() {
    if (!form.target_role.trim()) { setError('请填写目标职位'); return }
    if (!form.raw_info.trim()) { setError('请填写个人经历'); return }
    setError('')
    setStep('generating')

    const sections = ALL_SECTIONS.filter(s => selectedSections.has(s))
    const loading = {}
    sections.forEach(s => { loading[s] = 'loading' })
    setProgress(loading)

    try {
      const response = await aiGenerateStream(
        resumeId,
        form.target_role,
        parseRawInfo(form.raw_info),
        sections,
      )

      for await (const data of parseSSE(response)) {
        if (data.error) { setError(data.error); setStep('form'); return }
        if (data.section) {
          setProgress(prev => ({ ...prev, [data.section]: 'done' }))
          onSection(data.section, data.content)
        }
        if (data.done) {
          setStep('done')
        }
      }
    } catch (e) {
      setError(e.message)
      setStep('form')
    }
  }

  const sections = ALL_SECTIONS.filter(s => selectedSections.has(s))
  const doneCount = Object.values(progress).filter(v => v === 'done').length

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">AI 一键生成简历</h2>
          {step !== 'generating' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          )}
        </div>

        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标职位 <span className="text-red-500">*</span></label>
              <input
                value={form.target_role}
                onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="如：后端工程师、产品经理"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                你的经历 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">（越详细越好）</span>
              </label>
              <textarea
                rows={6}
                value={form.raw_info}
                onChange={e => setForm(f => ({ ...f, raw_info: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder={`在A公司做了3年Java开发，负责订单系统，日均处理百万订单。\n某大学计算机本科2018届毕业。\n熟悉 Spring Boot, MySQL, Redis...`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生成内容</label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SECTIONS.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSections.has(s)}
                      onChange={() => toggleSection(s)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{SECTION_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleGenerate}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                开始生成
              </button>
            </div>
          </div>
        )}

        {(step === 'generating' || step === 'done') && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {step === 'generating' ? 'AI 正在生成中，请稍候...' : '✅ 生成完成，内容已写入简历'}
            </p>
            <div className="space-y-2 mb-6">
              {sections.map(s => {
                const status = progress[s]
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-5 text-center">
                      {status === 'done' ? '✅' : status === 'loading' ? '⏳' : '⬜'}
                    </span>
                    <span className="text-sm text-gray-700">{SECTION_LABEL[s]}</span>
                    {status === 'loading' && (
                      <span className="text-xs text-indigo-500">生成中...</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${sections.length ? (doneCount / sections.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right mb-4">{doneCount} / {sections.length}</p>

            {step === 'done' && (
              <button onClick={onClose}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                完成
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

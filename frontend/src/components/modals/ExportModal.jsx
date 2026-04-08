import { useState, useEffect } from 'react'
import { listTemplates, exportPdf, previewResume } from '../../api'

export default function ExportModal({ resumeId, onClose }) {
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState('default.html')
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listTemplates()
      .then(data => setTemplates(data))
      .catch(() => setTemplates([]))
  }, [])

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const blob = await exportPdf(resumeId, selected)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${resumeId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setExporting(false)
    }
  }

  async function handlePreview() {
    setPreviewing(true)
    setError('')
    try {
      const html = await previewResume(resumeId, selected)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      setError(e.message)
    } finally {
      setPreviewing(false)
    }
  }

  // 默认模板固定在第一位，数据库模板使用后端返回的 file_name
  const allTemplates = [
    { id: 'default', name: '简约', file_name: 'default.html', is_premium: false },
    ...templates
      .filter(t => t.file_name !== 'default.html')
      .map(t => ({ id: t.id, name: t.name, file_name: t.file_name, is_premium: t.is_premium })),
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">导出 PDF</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-3">选择模板</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {allTemplates.map(t => (
            <button
              key={t.file_name}
              onClick={() => !t.is_premium && setSelected(t.file_name)}
              className={`relative border-2 rounded-xl p-4 text-sm font-medium transition-all ${
                t.is_premium
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : selected === t.file_name
                    ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.name}
              {t.is_premium && (
                <span className="absolute top-1 right-1 text-xs bg-yellow-100 text-yellow-600 px-1.5 rounded-full">PRO</span>
              )}
              {selected === t.file_name && !t.is_premium && (
                <span className="block text-xs text-indigo-500 mt-1">已选择</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="flex-1 border border-indigo-300 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            {previewing ? '加载中...' : '预览'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {exporting ? '导出中...' : '下载 PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

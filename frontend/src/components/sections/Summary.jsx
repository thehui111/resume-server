import { useState, useEffect } from 'react'
import { saveSection } from '../../api'

export default function Summary({ resumeId, data, onSaved }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setText(data.text || '')
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      const content = { text }
      await saveSection(resumeId, 'summary', content, 1)
      onSaved?.('summary', content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">个人总结</h3>
      <textarea
        rows={5}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="简洁描述你的核心竞争力，突出最匹配目标职位的经验和能力，不超过 80 字..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${text.length > 80 ? 'text-red-500' : 'text-gray-400'}`}>
          {text.length} / 80 字
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
        </button>
      </div>
    </div>
  )
}

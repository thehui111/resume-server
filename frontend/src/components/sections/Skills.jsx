import { useState, useEffect } from 'react'
import { saveSection } from '../../api'

const EMPTY = { languages: [], frameworks: [], tools: [] }

function TagInput({ label, tags, onChange }) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  function remove(tag) { onChange(tags.filter(t => t !== tag)) }

  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-8">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
            {tag}
            <button onClick={() => remove(tag)} className="text-indigo-400 hover:text-indigo-600 leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="输入后按 Enter 添加"
        />
        <button onClick={add} className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">添加</button>
      </div>
    </div>
  )
}

export default function Skills({ resumeId, data, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...data })
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      await saveSection(resumeId, 'skills', form, 4)
      onSaved?.('skills', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">技能</h3>
      <div className="space-y-5">
        <TagInput label="编程语言" tags={form.languages}
          onChange={v => setForm(f => ({ ...f, languages: v }))} />
        <TagInput label="框架 / 库" tags={form.frameworks}
          onChange={v => setForm(f => ({ ...f, frameworks: v }))} />
        <TagInput label="工具 / 平台" tags={form.tools}
          onChange={v => setForm(f => ({ ...f, tools: v }))} />
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
        </button>
      </div>
    </div>
  )
}

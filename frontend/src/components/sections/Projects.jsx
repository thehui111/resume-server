import { useState, useEffect } from 'react'
import { saveSection } from '../../api'

const EMPTY_ITEM = { name: '', role: '', description: '', tech_stack: [] }

export default function Projects({ resumeId, data, onSaved }) {
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (Array.isArray(data)) setItems(data)
  }, [data])

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM, tech_stack: [] }]) }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function update(idx, key, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }
  function addTech(idx, val) {
    const v = val.trim()
    if (!v) return
    const cur = items[idx].tech_stack || []
    if (!cur.includes(v)) update(idx, 'tech_stack', [...cur, v])
  }
  function removeTech(idx, tech) {
    update(idx, 'tech_stack', (items[idx].tech_stack || []).filter(t => t !== tech))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSection(resumeId, 'projects', items, 5)
      onSaved?.('projects', items)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">项目经历</h3>
        <button onClick={addItem} className="text-indigo-600 text-sm hover:text-indigo-700 font-medium">+ 添加</button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">暂无项目经历，点击「添加」新增</p>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => removeItem(idx)} className="text-xs text-red-400 hover:text-red-600">删除</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">项目名称</label>
                <input value={item.name} onChange={e => update(idx, 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="项目名" />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">担任角色</label>
                <input value={item.role} onChange={e => update(idx, 'role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="如：后端负责人" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">项目描述</label>
              <textarea value={item.description} onChange={e => update(idx, 'description', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="描述项目背景、你的职责和项目成果..." />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-2 block">技术栈</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(item.tech_stack || []).map(tech => (
                  <span key={tech} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                    {tech}
                    <button onClick={() => removeTech(idx, tech)} className="text-gray-400 hover:text-gray-600">×</button>
                  </span>
                ))}
              </div>
              <TechInput onAdd={val => addTech(idx, val)} />
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
          </button>
        </div>
      )}
    </div>
  )
}

function TechInput({ onAdd }) {
  const [val, setVal] = useState('')
  function submit() { onAdd(val); setVal('') }
  return (
    <div className="flex gap-2">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), submit())}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="如：Java, Spring Boot" />
      <button onClick={submit} className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">添加</button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { saveSection } from '../../api'

const EMPTY_ITEM = { company: '', title: '', start: '', end: '', description: '' }

export default function WorkExp({ resumeId, data, onSaved }) {
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (Array.isArray(data)) setItems(data)
  }, [data])

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  function updateItem(idx, key, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSection(resumeId, 'work_exp', items, 2)
      onSaved?.('work_exp', items)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">工作经历</h3>
        <button onClick={addItem} className="text-indigo-600 text-sm hover:text-indigo-700 font-medium">
          + 添加
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">暂无工作经历，点击「添加」新增</p>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => removeItem(idx)} className="text-xs text-red-400 hover:text-red-600">删除</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">公司</label>
                <input value={item.company} onChange={e => updateItem(idx, 'company', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="公司名称" />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">职位</label>
                <input value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="职位名称" />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">开始时间</label>
                <input value={item.start} onChange={e => updateItem(idx, 'start', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2021-03" />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">结束时间</label>
                <input value={item.end} onChange={e => updateItem(idx, 'end', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="至今" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">工作描述</label>
              <textarea value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="使用 STAR 法则描述工作内容和成果..." />
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

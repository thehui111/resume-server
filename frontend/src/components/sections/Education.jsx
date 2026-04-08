import { useState, useEffect } from 'react'
import { saveSection } from '../../api'

const EMPTY_ITEM = { school: '', degree: '', major: '', start: '', end: '' }

export default function Education({ resumeId, data, onSaved }) {
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (Array.isArray(data)) setItems(data)
  }, [data])

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function update(idx, key, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSection(resumeId, 'education', items, 3)
      onSaved?.('education', items)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">教育背景</h3>
        <button onClick={addItem} className="text-indigo-600 text-sm hover:text-indigo-700 font-medium">+ 添加</button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">暂无教育经历，点击「添加」新增</p>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => removeItem(idx)} className="text-xs text-red-400 hover:text-red-600">删除</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['school', '学校', '某大学'],
                ['degree', '学位', '本科 / 硕士 / 博士'],
                ['major', '专业', '计算机科学'],
                ['', '', ''],
                ['start', '入学时间', '2014-09'],
                ['end', '毕业时间', '2018-06'],
              ].filter(([k]) => k).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="text-xs text-gray-600 mb-1 block">{label}</label>
                  <input value={item[key]} onChange={e => update(idx, key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={placeholder} />
                </div>
              ))}
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

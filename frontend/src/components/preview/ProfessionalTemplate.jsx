import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function ProfessionalTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div style={{ fontFamily: '"NotoSansSC", "PingFang SC", Arial, sans-serif', fontSize: '10.5pt', lineHeight: 1.55, color: '#2c2c2c' }}>
      <style>{`
        .pr-topbar { background: #1e3a5f; color: #fff; padding: 24px 40px; }
        .pr-topbar h1 { font-size: 20pt; font-weight: 500; margin-bottom: 6px; color: #fff; }
        .pr-topbar .pr-avatar { width: 72px; height: 72px; borderRadius: 50%; objectFit: cover; float: right; border: 2px solid rgba(255,255,255,0.3); }
        .pr-topbar .pr-contact { font-size: 9.5pt; color: #cbd5e1; }
        .pr-topbar .pr-contact span { margin-right: 14px; }
        .pr-content { padding: 22px 40px 36px; }
        .pr-section { margin-bottom: 18px; }
        .pr-section-title { font-size: 11pt; font-weight: 700; color: #1e3a5f; borderBottom: 1.5px solid #1e3a5f; paddingBottom: 4px; marginBottom: 10px; }
        .pr-summary { color: #4a4a4a; white-space: pre-line; }
        .pr-item { margin-bottom: 11px; }
        .pr-item-row { display: flex; justify-content: space-between; align-items: baseline; }
        .pr-item-title { font-weight: 700; color: #1f2937; }
        .pr-item-sub { font-size: 9.5pt; color: #475569; margin-top: 1px; }
        .pr-item-date { font-size: 9pt; color: #64748b; white-space: nowrap; margin-left: 8px; }
        .pr-item-desc { margin-top: 4px; color: #374151; white-space: pre-line; font-size: 10pt; }
        .pr-skills-row { margin-bottom: 5px; font-size: 10pt; }
        .pr-skills-label { font-weight: 700; color: #1e3a5f; display: inline; }
        .pr-skills-val { color: #374151; display: inline; }
        .pr-tech { font-size: 9pt; color: #64748b; margin-top: 3px; }
      `}</style>

      <div className="pr-topbar">
        {basic.avatar_url && <img className="pr-avatar" src={basic.avatar_url} alt="avatar" />}
        <h1>
          <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
        </h1>
        <div className="pr-contact">
          {basic.email !== undefined && <span><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></span>}
          {basic.phone !== undefined && <span><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></span>}
          {basic.location !== undefined && <span><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></span>}
        </div>
      </div>

      <div className="pr-content">
        {summary && (
          <div className="pr-section">
            <div className="pr-section-title">个人总结</div>
            <div className="pr-summary">
              <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
            </div>
          </div>
        )}

        {workExp.length > 0 && (
          <div className="pr-section">
            <div className="pr-section-title">工作经历</div>
            {workExp.map((exp, i) => (
              <div className="pr-item" key={i}>
                <div className="pr-item-row">
                  <span className="pr-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                  <span className="pr-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
                </div>
                <div className="pr-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
                {exp.description !== undefined && <div className="pr-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div className="pr-section">
            <div className="pr-section-title">项目经历</div>
            {projects.map((proj, i) => (
              <div className="pr-item" key={i}>
                <div className="pr-item-row">
                  <span className="pr-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                  {proj.role !== undefined && <span className="pr-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
                </div>
                {proj.description !== undefined && <div className="pr-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="pr-tech">技术栈：<PreviewEditable value={proj.tech_stack.join('、')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
                )}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div className="pr-section">
            <div className="pr-section-title">教育背景</div>
            {education.map((edu, i) => (
              <div className="pr-item" key={i}>
                <div className="pr-item-row">
                  <span className="pr-item-title"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></span>
                  <span className="pr-item-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></span>
                </div>
                <div className="pr-item-sub"><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
              </div>
            ))}
          </div>
        )}

        {skills && (
          <div className="pr-section">
            <div className="pr-section-title">技能</div>
            {skills.languages && skills.languages.length > 0 && <div className="pr-skills-row"><span className="pr-skills-label">编程语言：</span><span className="pr-skills-val"><PreviewEditable value={skills.languages.join('、')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></span></div>}
            {skills.frameworks && skills.frameworks.length > 0 && <div className="pr-skills-row"><span className="pr-skills-label">框架/库：</span><span className="pr-skills-val"><PreviewEditable value={skills.frameworks.join('、')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></span></div>}
            {skills.tools && skills.tools.length > 0 && <div className="pr-skills-row"><span className="pr-skills-label">工具/平台：</span><span className="pr-skills-val"><PreviewEditable value={skills.tools.join('、')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></span></div>}
          </div>
        )}
      </div>
    </div>
  )
}

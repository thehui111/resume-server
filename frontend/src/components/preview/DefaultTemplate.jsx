import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function DefaultTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div
      className="bg-white text-[#222] leading-relaxed p-7 select-text"
      style={{ fontFamily: '"STHeiti", "PingFang SC", Arial, sans-serif', fontSize: '11pt', lineHeight: 1.5 }}
    >
      <style>{`
        .dp-h1 { font-size: 20pt; font-weight: 700; margin-bottom: 4px; }
        .dp-contact { color: #555; font-size: 10pt; margin-bottom: 16px; }
        .dp-contact span { margin-right: 16px; }
        .dp-section { margin-bottom: 18px; }
        .dp-section-title { font-size: 12pt; font-weight: 700; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .dp-summary { color: #444; }
        .dp-item { margin-bottom: 12px; }
        .dp-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .dp-item-title { font-weight: 600; }
        .dp-item-sub { color: #555; font-size: 10pt; }
        .dp-item-date { color: #777; font-size: 10pt; white-space: nowrap; }
        .dp-item-desc { margin-top: 4px; color: #333; white-space: pre-line; }
        .dp-skills-group { margin-bottom: 6px; }
        .dp-skills-label { font-weight: 600; display: inline; }
        .dp-skills-values { color: #444; display: inline; }
        .dp-tech { color: #555; font-size: 9.5pt; margin-top: 3px; }
        .dp-header-wrap { position: relative; }
        .dp-header-wrap.has-avatar { padding-right: 96px; }
        .dp-avatar { position: absolute; top: 0; right: 0; width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
      `}</style>

      <div className={`dp-header-wrap ${basic.avatar_url ? 'has-avatar' : ''}`}>
        {basic.avatar_url && <img className="dp-avatar" src={basic.avatar_url} alt="avatar" />}
        <div className="dp-h1">
          <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
        </div>
        <div className="dp-contact">
          {basic.email !== undefined && <span><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></span>}
          {basic.phone !== undefined && <span><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></span>}
          {basic.location !== undefined && <span><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></span>}
          {basic.linkedin !== undefined && <span><PreviewEditable value={basic.linkedin} onChange={(v) => updateBasic('linkedin', v)} editable={editable} /></span>}
          {basic.github !== undefined && <span><PreviewEditable value={basic.github} onChange={(v) => updateBasic('github', v)} editable={editable} /></span>}
        </div>
      </div>

      {summary && (
        <div className="dp-section">
          <div className="dp-section-title">个人总结</div>
          <div className="dp-summary dp-item-desc">
            <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
          </div>
        </div>
      )}

      {workExp.length > 0 && (
        <div className="dp-section">
          <div className="dp-section-title">工作经历</div>
          {workExp.map((exp, i) => (
            <div className="dp-item" key={i}>
              <div className="dp-item-header">
                <span className="dp-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                <span className="dp-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="dp-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
              {exp.description !== undefined && <div className="dp-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="dp-section">
          <div className="dp-section-title">项目经历</div>
          {projects.map((proj, i) => (
            <div className="dp-item" key={i}>
              <div className="dp-item-header">
                <span className="dp-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                {proj.role !== undefined && <span className="dp-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
              </div>
              {proj.description !== undefined && <div className="dp-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="dp-tech">技术栈：<PreviewEditable value={proj.tech_stack.join(' · ')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="dp-section">
          <div className="dp-section-title">教育背景</div>
          {education.map((edu, i) => (
            <div className="dp-item" key={i}>
              <div className="dp-item-header">
                <span className="dp-item-title"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></span>
                <span className="dp-item-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="dp-item-sub"><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="dp-section">
          <div className="dp-section-title">技能</div>
          {skills.languages && skills.languages.length > 0 && <div className="dp-skills-group"><span className="dp-skills-label">编程语言：</span><span className="dp-skills-values"><PreviewEditable value={skills.languages.join(' · ')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></span></div>}
          {skills.frameworks && skills.frameworks.length > 0 && <div className="dp-skills-group"><span className="dp-skills-label">框架/库：</span><span className="dp-skills-values"><PreviewEditable value={skills.frameworks.join(' · ')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></span></div>}
          {skills.tools && skills.tools.length > 0 && <div className="dp-skills-group"><span className="dp-skills-label">工具/平台：</span><span className="dp-skills-values"><PreviewEditable value={skills.tools.join(' · ')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></span></div>}
        </div>
      )}
    </div>
  )
}

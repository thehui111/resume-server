import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function MinimalTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div style={{ fontFamily: '"NotoSansSC", "PingFang SC", Arial, sans-serif', fontSize: '10pt', lineHeight: 1.45, color: '#000', padding: '40px 48px' }}>
      <style>{`
        .mn-h1 { font-size: 18pt; font-weight: 400; margin-bottom: 6px; letter-spacing: 1px; }
        .mn-contact { font-size: 9pt; color: #555; margin-bottom: 24px; }
        .mn-contact span { margin-right: 14px; }
        .mn-section { margin-bottom: 20px; }
        .mn-section-title { font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 10px; }
        .mn-item { margin-bottom: 10px; }
        .mn-item-row { display: flex; justify-content: space-between; }
        .mn-item-title { font-weight: 600; }
        .mn-item-date { font-size: 9pt; color: #666; }
        .mn-item-sub { font-size: 9.5pt; color: #444; margin-top: 1px; }
        .mn-item-desc { margin-top: 3px; color: #333; white-space: pre-line; font-size: 9.5pt; }
        .mn-skills-row { font-size: 9.5pt; margin-bottom: 3px; }
        .mn-skills-label { font-weight: 600; }
        .mn-avatar { width: 64px; height: 64px; borderRadius: 50%; objectFit: cover; float: right; marginLeft: 14px; marginBottom: 10px; }
        .mn-tech { font-size: 9pt; color: #666; margin-top: 2px; }
      `}</style>

      {basic.avatar_url && <img className="mn-avatar" src={basic.avatar_url} alt="avatar" />}
      <div className="mn-h1">
        <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
      </div>
      <div className="mn-contact">
        {basic.email !== undefined && <span><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></span>}
        {basic.phone !== undefined && <span><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></span>}
        {basic.location !== undefined && <span><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></span>}
      </div>

      {summary && (
        <div className="mn-section">
          <div className="mn-section-title">Summary</div>
          <div className="mn-item-desc">
            <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
          </div>
        </div>
      )}

      {workExp.length > 0 && (
        <div className="mn-section">
          <div className="mn-section-title">Experience</div>
          {workExp.map((exp, i) => (
            <div className="mn-item" key={i}>
              <div className="mn-item-row">
                <span className="mn-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                <span className="mn-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="mn-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
              {exp.description !== undefined && <div className="mn-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mn-section">
          <div className="mn-section-title">Projects</div>
          {projects.map((proj, i) => (
            <div className="mn-item" key={i}>
              <div className="mn-item-row">
                <span className="mn-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                {proj.role !== undefined && <span className="mn-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
              </div>
              {proj.description !== undefined && <div className="mn-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="mn-tech">Tech: <PreviewEditable value={proj.tech_stack.join('、')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mn-section">
          <div className="mn-section-title">Education</div>
          {education.map((edu, i) => (
            <div className="mn-item" key={i}>
              <div className="mn-item-row">
                <span className="mn-item-title"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></span>
                <span className="mn-item-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="mn-item-sub"><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="mn-section">
          <div className="mn-section-title">Skills</div>
          {skills.languages && skills.languages.length > 0 && <div className="mn-skills-row"><span className="mn-skills-label">Languages：</span><PreviewEditable value={skills.languages.join('、')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></div>}
          {skills.frameworks && skills.frameworks.length > 0 && <div className="mn-skills-row"><span className="mn-skills-label">Frameworks：</span><PreviewEditable value={skills.frameworks.join('、')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></div>}
          {skills.tools && skills.tools.length > 0 && <div className="mn-skills-row"><span className="mn-skills-label">Tools：</span><PreviewEditable value={skills.tools.join('、')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></div>}
        </div>
      )}
    </div>
  )
}

-- add delete on cascade when we delete one skill
PRAGMA writable_schema = ON;

-- skill side (all 4 tables)
UPDATE sqlite_master
SET sql = replace(sql, 'skills_tbl(skill_id)', 'skills_tbl(skill_id) on delete cascade')
WHERE type = 'table'
  AND name IN ('project_skill_tbl','resources_skills_tbl','note_skill_tbl','knowlage_skills_tbl');

-- other side, one per table
UPDATE sqlite_master
SET sql = replace(sql, 'project_tbl(project_id)', 'project_tbl(project_id) on delete cascade')
WHERE type = 'table' AND name = 'project_skill_tbl';

UPDATE sqlite_master
SET sql = replace(sql, 'resources_tbl(resource_id)', 'resources_tbl(resource_id) on delete cascade')
WHERE type = 'table' AND name = 'resources_skills_tbl';

UPDATE sqlite_master
SET sql = replace(sql, 'notes_tbl(note_id)', 'notes_tbl(note_id) on delete cascade')
WHERE type = 'table' AND name = 'note_skill_tbl';

UPDATE sqlite_master
SET sql = replace(sql, 'knowlage_tbl(knowlage_id)', 'knowlage_tbl(knowlage_id) on delete cascade')
WHERE type = 'table' AND name = 'knowlage_skills_tbl';

PRAGMA writable_schema = OFF;
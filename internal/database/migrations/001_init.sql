CREATE TABLE user_tbl(
    user_id integer primary key autoincrement,
    username text not null unique,
    email text not null unique,
    password_hash text not null,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- lists module (months)
create table lists_tbl(
    list_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id) on delete cascade,
    title text not null,
    description text,
    start_date text not null,
    end_date text not null,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_lists_user on lists_tbl(user_id);

create table list_task_tbl(
    list_task_id integer primary key autoincrement,
    list_id integer not null references lists_tbl(list_id) on delete cascade,
    title text,
    task_date text not null,
    note text,
    position integer not null default 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- module tasks
create table tasks_tbl(
    task_id integer primary key autoincrement,
    title text not null,
    status text not null default 'TO_DO' check (status in ('TO_DO', 'DOING', 'DONE')),
    priority text not null default 'LOW' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
    start_date text not null,
    end_date text not null,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    list_task_id integer references list_task_tbl(list_task_id) on delete cascade, -- optional
    project_id integer references project_tbl(project_id) on delete cascade -- optional
);
create index idx_subtasks_task on tasks_tbl(list_task_id);
create index idx_project_task on tasks_tbl(project_id);

-- module resources
create table resources_tbl(
    resource_id integer primary key autoincrement,
    name text not null,
    link text not null,
    type text not null,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id integer references user_tbl(user_id) on delete cascade -- no optional
);
create index idx_resource_user on resources_tbl(user_id);

-- projects modules
create table project_tbl(
    project_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id) on delete cascade,
    title text not null,
    description text,
    start_date text not null,
    end_date text,
    status text not null default('ACTIVE') check (status in ('ACTIVE', 'DONE')),
    progress integer not null default 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_projects_user on project_tbl(user_id);

-- tasks - projects in tasks_tbl ---


create table project_activity_tbl(
    project_activity_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id),
    project_id integer not null references project_tbl(project_id),
    action text not null,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_pro_activity on project_activity_tbl(project_id);

-- pivote table resources - projects
create table resources_projects_tbl(
    project_id integer not null references project_tbl(project_id),
    resource_id integer not null references resources_tbl(resource_id),
    primary key (project_id, resource_id)
);

-- skills module
create table skills_tbl(
    skill_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id) on delete cascade,
    name text not null,
    color text not null default '#64748b',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_skills_user on skills_tbl(user_id);


-- pivote table project - skill
create table project_skill_tbl(
    project_id integer not null references project_tbl(project_id),
    skill_id integer not null references skills_tbl(skill_id),
    PRIMARY KEY (project_id, skill_id)
);

-- pivote table resources - skills
create table resources_skills_tbl(
    resource_id integer not null references resources_tbl(resource_id),
    skill_id integer not null references skills_tbl(skill_id),
    PRIMARY KEY (resource_id, skill_id)
);


-- module notes
create table notes_tbl(
    note_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id),
    title text not null,
    color text not null default '#64748b',
    description text,
    content text,
    pinned integer not null default 0 check (pinned in (0,1)),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_notes_user on notes_tbl(user_id);

-- pivote table notes - skills
create table note_skill_tbl(
    note_id integer not null references notes_tbl(note_id),
    skill_id integer not null references skills_tbl(skill_id),
    primary key (note_id, skill_id)
);

-- pivote table notes -projects
create table note_projects(
    note_id integer not null references notes_tbl(note_id),
    project_id integer not null references project_tbl(project_id),
    primary key (note_id, project_id)
);

-- pivote table resources - notes
create table resources_note_tbl(
    note_id integer not null references notes_tbl(note_id),
    resource_id integer not null references resources_tbl(resource_id),
    primary key (note_id, resource_id)
);

-- module knowlage
create table knowlage_tbl(
    knowlage_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id),
    name text not null,
    description text,
    color text not null default '#64748b',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_knowlage_user on knowlage_tbl(user_id);

-- pivote table knowlage - skills
create table knowlage_skills_tbl(
    knowlage_id integer not null references knowlage_tbl(knowlage_id),
    skill_id integer not null references skills_tbl(skill_id),
    primary key (knowlage_id, skill_id)
);


-- module my passwords
create table vault_tbl( -- to save a master password
    user_id integer primary key references user_tbl(user_id) on delete cascade,
    kdf_salt blob not null,
    wrapped_key blob not null,
    wrap_nonce blob not null,
    recovery_wrapped_key blob,
    recovery_nonce blob,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

create table pass_tbl(
    pass_id integer primary key autoincrement,
    user_id integer not null references user_tbl(user_id) on delete cascade,
    name text not null,              -- e.g. "Gmail", "Outlook"
    site_username text,              -- e.g. the email address
    url text,
    secret_enc blob not null,        -- encrypted password
    nonce blob not null,             -- new random 12 bytes on every save
    color text not null default '#64748b',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
create index idx_pass_user on pass_tbl(user_id);

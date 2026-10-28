import IconBase from "../components/IconBase";


export const CloseIcon = ({ 
    size,
    className
}: { 
    size?: number,
    className?: string
}) => (
  <IconBase 
    size={size}
    className={`${className}`}
><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></IconBase>
)

export const GearIcon = ({
    size,
    className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
)

export const ProjectsIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </IconBase>
)

export const AgentIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M9 13v2" />
    <path d="M15 13v2" />
  </IconBase>
)

export const MonthIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </IconBase>
)

export const SkillsIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </IconBase>
)

export const KnowledgeIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </IconBase>
)

export const PasswordsIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3" />
  </IconBase>
)

export const ResourcesIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </IconBase>
)

export const NotesIcon = ({
  size,
  className
}: {
    size?: number,
    className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </IconBase>
)

export const PlusIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
)

export const ArrowUpIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </IconBase>
)

export const ArrowDownIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </IconBase>
)

export const ArrowLeftIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M19 12H5" />
    <path d="m12 5-7 7 7 7" />
  </IconBase>
)

export const ArrowRightIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </IconBase>
)

export const EditIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </IconBase>
)

export const DeleteIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m19 6-1 14H6L5 6" />
    <path d="M10 11v5M14 11v5" />
  </IconBase>
)

export const EyeIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
)

export const CopyIcon = ({
  size,
  className
}: {
  size?: number,
  className?: string
}) => (
  <IconBase
    size={size}
    className={`${className}`}
  >
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </IconBase>
)
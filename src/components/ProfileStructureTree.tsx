import { useState } from 'react'
import { Label } from '@entur/typography'
import type { StructureNode, ProfileStructure, ProfileData, ActiveProfile, ProfileStatus } from '../types'

const STATUS_COLOR: Record<ProfileStatus, string> = {
  required: '#2e7d32',
  optional: '#1565c0',
  'not-in-profile': '#e0e0e0',
}

interface TreeNodeProps {
  node: StructureNode
  depth: number
  selectedNode: StructureNode | null
  onSelect: (node: StructureNode) => void
  profileData: ProfileData | null
}

function TreeNode({ node, depth, selectedNode, onSelect, profileData }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isSelected = selectedNode?.id === node.id
  const profileStatus: ProfileStatus | undefined = node.elementRef
    ? profileData?.[node.elementRef]?.status
    : undefined
  const isNotInProfile = profileStatus === 'not-in-profile'

  const borderColor = isSelected
    ? '#1565c0'
    : profileStatus
      ? STATUS_COLOR[profileStatus]
      : node.type === 'container'
        ? '#e07b00'
        : 'transparent'

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect(node)
          if (hasChildren) setExpanded((e) => !e)
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: `4px 10px 4px ${8 + depth * 12}px`,
          fontSize: '11px',
          cursor: 'pointer',
          background: isSelected
            ? '#e3f2fd'
            : node.type === 'container'
              ? '#fff8f0'
              : 'transparent',
          border: 'none',
          borderLeft: `3px solid ${borderColor}`,
          color: isNotInProfile ? '#bbb' : node.type === 'collection' ? '#888' : '#2a2a2a',
          fontStyle: node.type === 'collection' ? 'italic' : 'normal',
          fontWeight: node.type === 'container' ? 600 : isSelected ? 500 : 'normal',
          opacity: isNotInProfile ? 0.5 : 1,
          textAlign: 'left',
          textDecoration: isNotInProfile ? 'line-through' : 'none',
        }}
      >
        <span style={{ width: '10px', flexShrink: 0, fontSize: '9px', color: '#aaa' }}>
          {hasChildren ? (expanded ? '▼' : '▶') : '●'}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.label}
        </span>
        {node.type === 'element' && profileData && profileStatus && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: STATUS_COLOR[profileStatus],
            flexShrink: 0,
          }} />
        )}
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNode={selectedNode}
              onSelect={onSelect}
              profileData={profileData}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export interface ProfileStructureTreeProps {
  structure: ProfileStructure
  profileData: ProfileData | null
  selectedNode: StructureNode | null
  onSelect: (node: StructureNode) => void
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
}

export function ProfileStructureTree({
  structure, profileData, selectedNode, onSelect, activeProfile, onProfileChange,
}: ProfileStructureTreeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Profile selector */}
      <div style={{ borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)', background: 'var(--colors-greys-white, #ffffff)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}>
          <Label as="span" margin="none" style={{ fontSize: '10px', color: 'var(--colors-greys-grey50, #888)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            Profil
          </Label>
          <select
            value={activeProfile ?? ''}
            onChange={(e) => onProfileChange((e.target.value || null) as ActiveProfile)}
            style={{
              flex: 1,
              border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
              borderRadius: '4px',
              padding: '3px 6px',
              fontSize: '11px',
              color: 'var(--colors-greys-grey10, #2a2a2a)',
              background: 'var(--colors-greys-white, #ffffff)',
              fontWeight: 500,
            }}
          >
            <option value="">— Ingen profil</option>
            <option value="fr">🇫🇷 Fransk profil</option>
            <option value="nordic">🇳🇴 Nordisk profil</option>
          </select>
        </div>
      </div>

      {/* Tree label */}
      <Label as="div" margin="none" style={{ padding: '6px 10px 3px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa' }}>
        Eksportstruktur
      </Label>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        <TreeNode
          node={structure.root}
          depth={0}
          selectedNode={selectedNode}
          onSelect={onSelect}
          profileData={profileData}
        />
      </div>
    </div>
  )
}

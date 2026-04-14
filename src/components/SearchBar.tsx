interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  groups: string[]
  activeGroup: string | null
  onGroupChange: (g: string | null) => void
}

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#89b4fa',
  FarePrice: '#a6e3a1',
  SalesOfferPackage: '#fab387',
  FareStructureElement: '#f38ba8',
  UsageParameter: '#cba6f7',
}

export function SearchBar({ query, onQueryChange, groups, activeGroup, onGroupChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Søk etter element..."
        className="w-60 px-3 py-1.5 text-sm bg-[#313244] border border-[#45475a] rounded-md text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa]"
      />
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onGroupChange(null)}
          className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors ${
            activeGroup === null
              ? 'bg-[#cdd6f4] text-[#1e1e2e] border-[#cdd6f4]'
              : 'border-[#45475a] text-[#6c7086] hover:border-[#cdd6f4] hover:text-[#cdd6f4]'
          }`}
        >
          Alle
        </button>
        {groups.map((g) => {
          const colour = GROUP_COLOURS[g] ?? '#cdd6f4'
          const isActive = activeGroup === g
          return (
            <button
              key={g}
              onClick={() => onGroupChange(isActive ? null : g)}
              style={isActive ? { backgroundColor: colour, color: '#1e1e2e', borderColor: colour } : { borderColor: '#45475a', color: '#6c7086' }}
              className="px-2.5 py-0.5 text-xs rounded-full border transition-colors hover:opacity-80"
            >
              {g}
            </button>
          )
        })}
      </div>
    </div>
  )
}

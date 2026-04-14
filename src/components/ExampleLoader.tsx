import { useState, useRef } from 'react'
import type { NeTExExample, LoadedFile } from '../types'
import { parseXmlInstance } from '../utils/xml-instance-parser'

interface ExampleLoaderProps {
  examples: NeTExExample[]
  onFileLoaded: (file: LoadedFile | null) => void
}

export function ExampleLoader({ examples, onFileLoaded }: ExampleLoaderProps) {
  const [open, setOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteXml, setPasteXml] = useState('')
  const [activeFilename, setActiveFilename] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function loadXml(xml: string, filename: string) {
    const instanceMap = parseXmlInstance(xml)
    onFileLoaded({ filename, instanceMap })
    setActiveFilename(filename)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => loadXml(ev.target!.result as string, file.name)
    reader.readAsText(file)
    setOpen(false)
  }

  function handlePaste() {
    if (pasteXml.trim()) {
      loadXml(pasteXml.trim(), 'clipboard.xml')
    }
    setPasteOpen(false)
    setPasteXml('')
  }

  function clearFile() {
    onFileLoaded(null)
    setActiveFilename(null)
  }

  return (
    <div className="flex items-center gap-2 relative">
      {activeFilename && (
        <div className="flex items-center gap-1.5 text-xs px-2 py-1 bg-[#1e3a2f] border border-[#a6e3a1] rounded text-[#a6e3a1]">
          <span className="max-w-[200px] truncate">{activeFilename}</span>
          <button onClick={clearFile} className="hover:text-white ml-1">✕</button>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#45475a] rounded text-[#cdd6f4] hover:border-[#cdd6f4] transition-colors"
        >
          Eksempler {open ? '▲' : '▼'}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-[#1e2030] border border-[#313244] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 text-xs text-[#6c7086] border-b border-[#313244]">Offisielle NeTEx-eksempler</div>
            <div className="max-h-64 overflow-y-auto">
              {examples.map((ex) => (
                <button
                  key={ex.filename}
                  onClick={() => { loadXml(ex.xml, ex.filename); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-[#cdd6f4] hover:bg-[#313244] transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="border-t border-[#313244]">
              <button
                onClick={() => { fileRef.current?.click(); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs text-[#a6adc8] hover:bg-[#313244]"
              >
                Last inn lokal XML-fil...
              </button>
              <button
                onClick={() => { setPasteOpen(true); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs text-[#a6adc8] hover:bg-[#313244]"
              >
                Lim inn XML...
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={handleFileChange} />

      {pasteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e2030] border border-[#313244] rounded-xl w-[600px] p-4 shadow-2xl">
            <div className="text-sm font-semibold text-[#cdd6f4] mb-3">Lim inn NeTEx XML</div>
            <textarea
              value={pasteXml}
              onChange={(e) => setPasteXml(e.target.value)}
              className="w-full h-64 bg-[#181825] border border-[#45475a] rounded text-xs font-mono text-[#a6adc8] p-2 focus:outline-none focus:border-[#89b4fa] resize-none"
              placeholder="<PublicationDelivery ...>...</PublicationDelivery>"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setPasteOpen(false); setPasteXml('') }}
                className="px-3 py-1.5 text-xs text-[#6c7086] border border-[#45475a] rounded hover:border-[#cdd6f4]"
              >
                Avbryt
              </button>
              <button
                onClick={handlePaste}
                className="px-3 py-1.5 text-xs bg-[#89b4fa] text-[#1e1e2e] rounded font-semibold hover:bg-[#b4d0ff]"
              >
                Last inn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

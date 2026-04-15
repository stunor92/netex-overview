import { useState, useRef } from 'react'
import { SecondaryButton, TertiaryButton, PrimaryButton } from '@entur/button'
import { Modal } from '@entur/modal'
import { TextArea } from '@entur/form'
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      {activeFilename && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '4px 8px',
          background: 'var(--colors-greys-grey90, #f8f8f8)',
          border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
          borderRadius: '4px',
          color: 'var(--colors-greys-grey10, #2a2a2a)',
        }}>
          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeFilename}
          </span>
          <TertiaryButton onClick={clearFile}>✕</TertiaryButton>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <SecondaryButton onClick={() => setOpen((v) => !v)}>
          Eksempler {open ? '▲' : '▼'}
        </SecondaryButton>

        {open && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            width: '320px',
            background: 'var(--colors-greys-white, #ffffff)',
            border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '11px',
              color: 'var(--colors-greys-grey50, #888)',
              borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)',
            }}>
              Offisielle NeTEx-eksempler
            </div>
            <div style={{ maxHeight: '256px', overflowY: 'auto' }}>
              {examples.map((ex) => (
                <button
                  type="button"
                  key={ex.filename}
                  onClick={() => { loadXml(ex.xml, ex.filename); setOpen(false) }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--colors-greys-grey10, #2a2a2a)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
              <button
                type="button"
                onClick={() => { fileRef.current?.click(); setOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--colors-greys-grey40, #555)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Last inn lokal XML-fil...
              </button>
              <button
                type="button"
                onClick={() => { setPasteOpen(true); setOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--colors-greys-grey40, #555)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Lim inn XML...
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={handleFileChange} />

      <Modal
        open={pasteOpen}
        onDismiss={() => { setPasteOpen(false); setPasteXml('') }}
        title="Lim inn NeTEx XML"
        size="medium"
      >
        <TextArea
          label="NeTEx XML"
          value={pasteXml}
          onChange={(e) => setPasteXml(e.target.value)}
          resize="none"
          style={{ width: '100%', height: '256px', fontFamily: 'monospace', fontSize: '12px' }}
          placeholder="<PublicationDelivery ...>...</PublicationDelivery>"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <TertiaryButton onClick={() => { setPasteOpen(false); setPasteXml('') }}>
            Avbryt
          </TertiaryButton>
          <PrimaryButton onClick={handlePaste}>
            Last inn
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Eye, Type, AlignLeft, Image as ImageIcon, Link as LinkIcon, Trash2, Plus, MoveVertical } from 'lucide-react'

interface EmailBlock {
  id: string
  type: 'heading' | 'paragraph' | 'button' | 'image' | 'spacer'
  content: {
    text?: string
    url?: string
    buttonText?: string
    imageUrl?: string
    fontSize?: string
    textAlign?: 'left' | 'center' | 'right'
    backgroundColor?: string
    textColor?: string
    padding?: string
  }
}

interface EmailBuilderProps {
  initialBlocks?: EmailBlock[]
  initialHtml?: string
  onSave: (blocks: EmailBlock[], html: string) => void
  onSaveAsTemplate?: (blocks: EmailBlock[], html: string, name: string) => void
}

export default function EmailBuilder({ initialBlocks = [], initialHtml = '', onSave, onSaveAsTemplate }: EmailBuilderProps) {
  // Parse HTML to blocks if provided
  const parseHtmlToBlocks = (html: string): EmailBlock[] => {
    if (!html) return []
    
    const blocks: EmailBlock[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Extract h1 tags
    doc.querySelectorAll('h1').forEach((h1, index) => {
      blocks.push({
        id: `heading-${Date.now()}-${index}`,
        type: 'heading',
        content: {
          text: h1.textContent || '',
          fontSize: h1.style.fontSize || '28px',
          textAlign: (h1.style.textAlign as any) || 'left',
          textColor: h1.style.color || '#333333'
        }
      })
    })
    
    // Extract p tags
    doc.querySelectorAll('p').forEach((p, index) => {
      if (p.textContent && p.textContent.trim()) {
        blocks.push({
          id: `paragraph-${Date.now()}-${index}`,
          type: 'paragraph',
          content: {
            text: p.textContent || '',
            fontSize: p.style.fontSize || '16px',
            textAlign: (p.style.textAlign as any) || 'left',
            textColor: p.style.color || '#666666'
          }
        })
      }
    })
    
    // Extract buttons (a tags with button styling)
    doc.querySelectorAll('a').forEach((a, index) => {
      if (a.style.backgroundColor || a.style.padding) {
        blocks.push({
          id: `button-${Date.now()}-${index}`,
          type: 'button',
          content: {
            buttonText: a.textContent || '',
            url: a.href || '#',
            backgroundColor: a.style.backgroundColor || '#10b981',
            textColor: a.style.color || '#ffffff',
            textAlign: 'center'
          }
        })
      }
    })
    
    return blocks.length > 0 ? blocks : getDefaultBlocks()
  }

  const getDefaultBlocks = (): EmailBlock[] => [
    {
      id: '1',
      type: 'heading',
      content: {
        text: 'Welcome to Our Store!',
        fontSize: '28px',
        textAlign: 'center',
        textColor: '#333333'
      }
    },
    {
      id: '2',
      type: 'paragraph',
      content: {
        text: 'We\'re excited to have you here. Discover amazing products and exclusive offers.',
        fontSize: '16px',
        textAlign: 'left',
        textColor: '#666666'
      }
    },
    {
      id: '3',
      type: 'button',
      content: {
        buttonText: 'Shop Now',
        url: 'https://yourstore.com',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        textAlign: 'center'
      }
    }
  ]

  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (initialBlocks.length > 0) return initialBlocks
    if (initialHtml) return parseHtmlToBlocks(initialHtml)
    return getDefaultBlocks()
  })
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Update blocks when initialHtml changes (e.g., when navigating back and forth in wizard)
  useEffect(() => {
    if (initialHtml) {
      const parsedBlocks = parseHtmlToBlocks(initialHtml)
      if (parsedBlocks.length > 0) {
        setBlocks(parsedBlocks)
      }
    }
  }, [initialHtml])

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type)
    }
    setBlocks([...blocks, newBlock])
  }

  const getDefaultContent = (type: EmailBlock['type']) => {
    switch (type) {
      case 'heading':
        return { text: 'New Heading', fontSize: '24px', textAlign: 'left' as const, textColor: '#333333' }
      case 'paragraph':
        return { text: 'Enter your text here...', fontSize: '16px', textAlign: 'left' as const, textColor: '#666666' }
      case 'button':
        return { buttonText: 'Click Here', url: '#', backgroundColor: '#10b981', textColor: '#ffffff', textAlign: 'center' as const }
      case 'image':
        return { imageUrl: 'https://via.placeholder.com/600x300', url: '#', textAlign: 'center' as const }
      case 'spacer':
        return { padding: '20px' }
    }
  }

  const updateBlock = (id: string, content: Partial<EmailBlock['content']>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content: { ...block.content, ...content } } : block
    ))
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const generateHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; padding: 40px; border-radius: 8px;">
              ${blocks.map(block => renderBlockHTML(block)).join('\n')}
            </div>
          </div>
        </body>
      </html>
    `
  }

  const renderBlockHTML = (block: EmailBlock) => {
    switch (block.type) {
      case 'heading':
        return `<h1 style="color: ${block.content.textColor}; font-size: ${block.content.fontSize}; text-align: ${block.content.textAlign}; margin: 20px 0;">${block.content.text}</h1>`
      case 'paragraph':
        return `<p style="color: ${block.content.textColor}; font-size: ${block.content.fontSize}; text-align: ${block.content.textAlign}; line-height: 1.6; margin: 15px 0; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;">${block.content.text}</p>`
      case 'button':
        return `<div style="text-align: ${block.content.textAlign}; margin: 30px 0;"><a href="${block.content.url}" style="display: inline-block; background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">${block.content.buttonText}</a></div>`
      case 'image':
        return `<div style="text-align: center; margin: 30px 0;"><a href="${block.content.url}"><img src="${block.content.imageUrl}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" /></a></div>`
      case 'spacer':
        return `<div style="height: ${block.content.padding};"></div>`
      default:
        return ''
    }
  }

  const handleSave = () => {
    const html = generateHTML()
    onSave(blocks, html)
  }

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }
    const html = generateHTML()
    if (onSaveAsTemplate) {
      onSaveAsTemplate(blocks, html, templateName)
      setShowSaveDialog(false)
      setTemplateName('')
    }
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              showPreview
                ? 'bg-emerald-500 text-white'
                : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08]'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onSaveAsTemplate && (
            <button 
              onClick={() => setShowSaveDialog(true)} 
              className="btn-secondary"
            >
              Save as Template
            </button>
          )}
          <button onClick={handleSave} className="btn-primary">
            Continue
          </button>
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-xl font-semibold mb-4">Save as Template</h3>
            <p className="text-white/60 text-sm mb-4">
              Give your template a name so you can reuse it later
            </p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., My Custom Welcome Email"
              className="input-premium w-full mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setTemplateName('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="btn-primary flex-1"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {!showPreview ? (
        <div className="grid lg:grid-cols-[250px,1fr,300px] gap-6">
          {/* Block Palette */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-3">Add Content</h3>
            <button
              onClick={() => addBlock('heading')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-colors"
            >
              <Type className="w-5 h-5" />
              <span>Heading</span>
            </button>
            <button
              onClick={() => addBlock('paragraph')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-colors"
            >
              <AlignLeft className="w-5 h-5" />
              <span>Paragraph</span>
            </button>
            <button
              onClick={() => addBlock('button')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              <span>Button</span>
            </button>
            <button
              onClick={() => addBlock('image')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Image</span>
            </button>
            <button
              onClick={() => addBlock('spacer')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Spacer</span>
            </button>
          </div>

          {/* Canvas */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 min-h-[600px]">
            <div className="bg-white rounded-lg p-8 max-w-[600px] mx-auto">
              {blocks.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <AlignLeft className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Add content blocks to start building your email</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative group cursor-pointer transition-all ${
                        selectedBlockId === block.id ? 'ring-2 ring-emerald-400 rounded-lg' : ''
                      }`}
                    >
                      {/* Block Controls */}
                      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                          disabled={index === 0}
                          className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30"
                        >
                          <MoveVertical className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                          disabled={index === blocks.length - 1}
                          className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30"
                        >
                          <MoveVertical className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                          className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Block Content */}
                      <div dangerouslySetInnerHTML={{ __html: renderBlockHTML(block) }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Properties</h3>
            {selectedBlock ? (
              <div className="space-y-4">
                {selectedBlock.type === 'heading' && (
                  <>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Heading Text</label>
                      <input
                        type="text"
                        value={selectedBlock.content.text}
                        onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Font Size</label>
                      <select
                        value={selectedBlock.content.fontSize}
                        onChange={(e) => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                        className="input-premium w-full"
                      >
                        <option value="20px">Small (20px)</option>
                        <option value="24px">Medium (24px)</option>
                        <option value="28px">Large (28px)</option>
                        <option value="36px">Extra Large (36px)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Text Color</label>
                      <input
                        type="color"
                        value={selectedBlock.content.textColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Alignment</label>
                      <select
                        value={selectedBlock.content.textAlign}
                        onChange={(e) => updateBlock(selectedBlock.id, { textAlign: e.target.value as any })}
                        className="input-premium w-full"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedBlock.type === 'paragraph' && (
                  <>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Paragraph Text</label>
                      <textarea
                        value={selectedBlock.content.text}
                        onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                        rows={4}
                        className="input-premium w-full resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Font Size</label>
                      <select
                        value={selectedBlock.content.fontSize}
                        onChange={(e) => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                        className="input-premium w-full"
                      >
                        <option value="14px">Small (14px)</option>
                        <option value="16px">Medium (16px)</option>
                        <option value="18px">Large (18px)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Text Color</label>
                      <input
                        type="color"
                        value={selectedBlock.content.textColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Alignment</label>
                      <select
                        value={selectedBlock.content.textAlign}
                        onChange={(e) => updateBlock(selectedBlock.id, { textAlign: e.target.value as any })}
                        className="input-premium w-full"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedBlock.type === 'button' && (
                  <>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Button Text</label>
                      <input
                        type="text"
                        value={selectedBlock.content.buttonText}
                        onChange={(e) => updateBlock(selectedBlock.id, { buttonText: e.target.value })}
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Link URL</label>
                      <input
                        type="url"
                        value={selectedBlock.content.url}
                        onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                        className="input-premium w-full"
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Background Color</label>
                      <input
                        type="color"
                        value={selectedBlock.content.backgroundColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Text Color</label>
                      <input
                        type="color"
                        value={selectedBlock.content.textColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Alignment</label>
                      <select
                        value={selectedBlock.content.textAlign}
                        onChange={(e) => updateBlock(selectedBlock.id, { textAlign: e.target.value as any })}
                        className="input-premium w-full"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedBlock.type === 'button' && (
                  <>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              updateBlock(selectedBlock.id, { imageUrl: reader.result as string })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="input-premium w-full text-sm"
                      />
                      <p className="text-white/40 text-xs mt-1">Upload from your computer</p>
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-white/40 text-xs">OR</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Image URL</label>
                      <input
                        type="url"
                        value={selectedBlock.content.imageUrl}
                        onChange={(e) => updateBlock(selectedBlock.id, { imageUrl: e.target.value })}
                        className="input-premium w-full"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-white/40 text-xs mt-1">Or paste an image URL</p>
                    </div>
                    {selectedBlock.content.imageUrl && (
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Preview</label>
                        <div className="rounded-lg border border-white/10 p-2 bg-white/[0.02]">
                          <img 
                            src={selectedBlock.content.imageUrl} 
                            alt="Preview" 
                            className="max-w-full h-auto rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Link URL (optional)</label>
                      <input
                        type="url"
                        value={selectedBlock.content.url}
                        onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                        className="input-premium w-full"
                        placeholder="https://"
                      />
                      <p className="text-white/40 text-xs mt-1">Where should the image link to?</p>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Alignment</label>
                      <select
                        value={selectedBlock.content.textAlign}
                        onChange={(e) => updateBlock(selectedBlock.id, { textAlign: e.target.value as any })}
                        className="input-premium w-full"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedBlock.type === 'spacer' && (
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Height</label>
                    <select
                      value={selectedBlock.content.padding}
                      onChange={(e) => updateBlock(selectedBlock.id, { padding: e.target.value })}
                      className="input-premium w-full"
                    >
                      <option value="10px">Small (10px)</option>
                      <option value="20px">Medium (20px)</option>
                      <option value="40px">Large (40px)</option>
                      <option value="60px">Extra Large (60px)</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm">Select a block to edit its properties</p>
            )}
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="rounded-2xl border border-white/10 bg-gray-100 p-6">
          <div 
            className="max-w-[600px] mx-auto bg-white shadow-lg"
            dangerouslySetInnerHTML={{ __html: generateHTML() }}
          />
        </div>
      )}
    </div>
  )
}

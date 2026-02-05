'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  Type, 
  Image, 
  Link as LinkIcon, 
  Palette, 
  Move, 
  Trash2, 
  Settings,
  Plus,
  Eye,
  Smartphone,
  Monitor
} from 'lucide-react'

interface EmailElement {
  id: string
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer'
  content: any
  styles: any
}

interface EmailCampaignBuilderProps {
  initialContent?: EmailElement[]
  onContentChange?: (content: EmailElement[]) => void
  onPreview?: () => void
}

const ELEMENT_TYPES = [
  {
    type: 'text',
    icon: Type,
    label: 'Text',
    description: 'Add headings, paragraphs, or formatted text'
  },
  {
    type: 'image',
    icon: Image,
    label: 'Image',
    description: 'Add images, logos, or graphics'
  },
  {
    type: 'button',
    icon: LinkIcon,
    label: 'Button',
    description: 'Add call-to-action buttons'
  },
  {
    type: 'divider',
    icon: Palette,
    label: 'Divider',
    description: 'Add horizontal lines or separators'
  },
  {
    type: 'spacer',
    icon: Plus,
    label: 'Spacer',
    description: 'Add vertical spacing'
  }
]

const DEFAULT_ELEMENTS: Record<string, Partial<EmailElement>> = {
  text: {
    content: {
      text: 'Your text here...',
      tag: 'p',
      alignment: 'left'
    },
    styles: {
      fontSize: '16px',
      color: '#333333',
      fontWeight: 'normal',
      lineHeight: '1.5',
      padding: '10px'
    }
  },
  image: {
    content: {
      src: '',
      alt: 'Image',
      link: '',
      alignment: 'center'
    },
    styles: {
      width: '100%',
      maxWidth: '600px',
      padding: '10px'
    }
  },
  button: {
    content: {
      text: 'Click Here',
      link: 'https://example.com',
      alignment: 'center'
    },
    styles: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      fontSize: '16px',
      textDecoration: 'none',
      display: 'inline-block',
      margin: '10px'
    }
  },
  divider: {
    content: {
      style: 'solid'
    },
    styles: {
      borderTop: '1px solid #cccccc',
      margin: '20px 0',
      width: '100%'
    }
  },
  spacer: {
    content: {},
    styles: {
      height: '20px',
      width: '100%'
    }
  }
}

export default function EmailCampaignBuilder({ 
  initialContent = [], 
  onContentChange,
  onPreview 
}: EmailCampaignBuilderProps) {
  const [elements, setElements] = useState<EmailElement[]>(initialContent)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [uploadingImage, setUploadingImage] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/campaigns/images/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('Image upload failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageSelect = async (elementId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            const imageUrl = await handleImageUpload(file)
            updateElement(elementId, {
              content: {
                ...elements.find(el => el.id === elementId)?.content,
                src: imageUrl,
                alt: file.name.split('.')[0]
              }
            })
          } catch (error) {
            // Error already handled in handleImageUpload
          }
        }
      }
      fileInputRef.current.click()
    }
  }

  const addElement = useCallback((type: string) => {
    const newElement: EmailElement = {
      id: generateId(),
      type: type as EmailElement['type'],
      content: DEFAULT_ELEMENTS[type]?.content || {},
      styles: DEFAULT_ELEMENTS[type]?.styles || {}
    }

    const updatedElements = [...elements, newElement]
    setElements(updatedElements)
    setSelectedElement(newElement.id)
    onContentChange?.(updatedElements)
  }, [elements, onContentChange])

  const updateElement = useCallback((id: string, updates: Partial<EmailElement>) => {
    const updatedElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    setElements(updatedElements)
    onContentChange?.(updatedElements)
  }, [elements, onContentChange])

  const deleteElement = useCallback((id: string) => {
    const updatedElements = elements.filter(el => el.id !== id)
    setElements(updatedElements)
    setSelectedElement(null)
    onContentChange?.(updatedElements)
  }, [elements, onContentChange])

  const moveElement = useCallback((fromIndex: number, toIndex: number) => {
    const updatedElements = [...elements]
    const [movedElement] = updatedElements.splice(fromIndex, 1)
    updatedElements.splice(toIndex, 0, movedElement)
    setElements(updatedElements)
    onContentChange?.(updatedElements)
  }, [elements, onContentChange])

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedElement) return

    const draggedIndex = elements.findIndex(el => el.id === draggedElement)
    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      moveElement(draggedIndex, targetIndex)
    }
    setDraggedElement(null)
  }

  const renderElement = (element: EmailElement, index: number) => {
    const isSelected = selectedElement === element.id
    const isDragged = draggedElement === element.id

    return (
      <div
        key={element.id}
        className={`relative group border-2 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:border-gray-600'
        } ${isDragged ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, element.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => setSelectedElement(element.id)}
      >
        {/* Element Controls */}
        <div className={`absolute -top-8 left-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? 'opacity-100' : ''
        }`}>
          <button
            className="p-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
            title="Move"
          >
            <Move className="w-3 h-3" />
          </button>
          <button
            className="p-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              deleteElement(element.id)
            }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Element Content */}
        <div className="p-2">
          {renderElementContent(element)}
        </div>

        {/* Drop Zone */}
        <div
          className="absolute -bottom-1 left-0 right-0 h-2 bg-blue-500 opacity-0 hover:opacity-50"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index + 1)}
        />
      </div>
    )
  }

  const renderElementContent = (element: EmailElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: element.styles.fontSize,
              color: element.styles.color,
              fontWeight: element.styles.fontWeight,
              lineHeight: element.styles.lineHeight,
              textAlign: element.content.alignment,
              padding: element.styles.padding
            }}
          >
            {element.content.tag === 'h1' && <h1>{element.content.text}</h1>}
            {element.content.tag === 'h2' && <h2>{element.content.text}</h2>}
            {element.content.tag === 'h3' && <h3>{element.content.text}</h3>}
            {element.content.tag === 'p' && <p>{element.content.text}</p>}
          </div>
        )

      case 'image':
        return (
          <div style={{ textAlign: element.content.alignment, padding: element.styles.padding }}>
            {element.content.src ? (
              <div className="relative group">
                <img
                  src={element.content.src}
                  alt={element.content.alt}
                  style={{
                    width: element.styles.width,
                    maxWidth: element.styles.maxWidth,
                    height: 'auto'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageSelect(element.id)
                    }}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Change Image'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                style={{
                  width: element.styles.width,
                  maxWidth: element.styles.maxWidth,
                  height: '200px'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageSelect(element.id)
                }}
              >
                <div className="text-center">
                  <Image className="w-8 h-8 mx-auto mb-2" />
                  <p>{uploadingImage ? 'Uploading...' : 'Click to add image'}</p>
                  <p className="text-xs mt-1">JPEG, PNG, GIF, WebP (max 5MB)</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'button':
        return (
          <div style={{ textAlign: element.content.alignment, padding: '10px' }}>
            <a
              href={element.content.link}
              style={{
                backgroundColor: element.styles.backgroundColor,
                color: element.styles.color,
                padding: element.styles.padding,
                borderRadius: element.styles.borderRadius,
                fontSize: element.styles.fontSize,
                textDecoration: element.styles.textDecoration,
                display: element.styles.display,
                margin: element.styles.margin
              }}
            >
              {element.content.text}
            </a>
          </div>
        )

      case 'divider':
        return (
          <div
            style={{
              borderTop: element.styles.borderTop,
              margin: element.styles.margin,
              width: element.styles.width
            }}
          />
        )

      case 'spacer':
        return (
          <div
            style={{
              height: element.styles.height,
              width: element.styles.width
            }}
          />
        )

      default:
        return <div>Unknown element type</div>
    }
  }

  const renderPropertyPanel = () => {
    if (!selectedElement) {
      return (
        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Element Selected</h3>
          <p className="text-gray-400">Select an element to edit its properties</p>
        </div>
      )
    }

    const element = elements.find(el => el.id === selectedElement)
    if (!element) return null

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-white mb-4 capitalize">{element.type} Properties</h3>
        
        {element.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Text</label>
              <textarea
                value={element.content.text}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, text: e.target.value }
                })}
                className="input-premium w-full h-20 resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tag</label>
              <select
                value={element.content.tag}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, tag: e.target.value }
                })}
                className="input-premium w-full text-sm"
              >
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Font Size</label>
              <input
                type="text"
                value={element.styles.fontSize}
                onChange={(e) => updateElement(element.id, {
                  styles: { ...element.styles, fontSize: e.target.value }
                })}
                className="input-premium w-full text-sm"
                placeholder="16px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
              <input
                type="color"
                value={element.styles.color}
                onChange={(e) => updateElement(element.id, {
                  styles: { ...element.styles, color: e.target.value }
                })}
                className="w-full h-10 rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Alignment</label>
              <select
                value={element.content.alignment}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, alignment: e.target.value }
                })}
                className="input-premium w-full text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {element.type === 'image' && (
          <>
            <div className="mb-4">
              <button
                onClick={() => handleImageSelect(element.id)}
                disabled={uploadingImage}
                className="w-full btn-primary text-sm disabled:opacity-50"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP (max 5MB)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
              <input
                type="url"
                value={element.content.src}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, src: e.target.value }
                })}
                className="input-premium w-full text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Alt Text</label>
              <input
                type="text"
                value={element.content.alt}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, alt: e.target.value }
                })}
                className="input-premium w-full text-sm"
                placeholder="Image description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Link URL (optional)</label>
              <input
                type="url"
                value={element.content.link}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, link: e.target.value }
                })}
                className="input-premium w-full text-sm"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Alignment</label>
              <select
                value={element.content.alignment}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, alignment: e.target.value }
                })}
                className="input-premium w-full text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {element.type === 'button' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Button Text</label>
              <input
                type="text"
                value={element.content.text}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, text: e.target.value }
                })}
                className="input-premium w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Link URL</label>
              <input
                type="url"
                value={element.content.link}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, link: e.target.value }
                })}
                className="input-premium w-full text-sm"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Background Color</label>
              <input
                type="color"
                value={element.styles.backgroundColor}
                onChange={(e) => updateElement(element.id, {
                  styles: { ...element.styles, backgroundColor: e.target.value }
                })}
                className="w-full h-10 rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Text Color</label>
              <input
                type="color"
                value={element.styles.color}
                onChange={(e) => updateElement(element.id, {
                  styles: { ...element.styles, color: e.target.value }
                })}
                className="w-full h-10 rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Alignment</label>
              <select
                value={element.content.alignment}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, alignment: e.target.value }
                })}
                className="input-premium w-full text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {element.type === 'spacer' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Height</label>
            <input
              type="text"
              value={element.styles.height}
              onChange={(e) => updateElement(element.id, {
                styles: { ...element.styles, height: e.target.value }
              })}
              className="input-premium w-full text-sm"
              placeholder="20px"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Elements Sidebar */}
      <div className="card-premium p-4">
        <h3 className="font-semibold text-white mb-4">Elements</h3>
        <div className="space-y-2">
          {ELEMENT_TYPES.map((elementType) => {
            const Icon = elementType.icon
            return (
              <button
                key={elementType.type}
                onClick={() => addElement(elementType.type)}
                className="w-full p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors text-left"
                title={elementType.description}
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-white">{elementType.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Editor */}
      <div className="lg:col-span-2">
        <div className="card-premium p-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Email Editor</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Desktop Preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Mobile Preview"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              {onPreview && (
                <button
                  onClick={onPreview}
                  className="btn-secondary text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-premium p-6 min-h-96">
          <div 
            className={`mx-auto bg-white border transition-all duration-300 ${
              previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}
            style={{ minHeight: '400px' }}
          >
            {elements.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start Building Your Email</h3>
                  <p className="text-gray-400">Drag elements from the sidebar to build your email</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {elements.map((element, index) => renderElement(element, index))}
                
                {/* Final drop zone */}
                <div
                  className="h-8 border-2 border-dashed border-transparent hover:border-blue-500 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, elements.length)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="card-premium p-4">
        <h3 className="font-semibold text-white mb-4">Properties</h3>
        {renderPropertyPanel()}
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
      />
    </div>
  )
}
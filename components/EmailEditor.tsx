'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'

type Props = {
  content: string
  onChange: (html: string) => void
}

export default function EmailEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  const addLink = () => {
    const url = prompt('Enter URL')
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border border-zinc-700 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border-b border-zinc-700">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="px-3 py-1 rounded bg-zinc-800 text-sm">Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="px-3 py-1 rounded bg-zinc-800 text-sm">Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="px-3 py-1 rounded bg-zinc-800 text-sm">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="px-3 py-1 rounded bg-zinc-800 text-sm">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-3 py-1 rounded bg-zinc-800 text-sm">List</button>
        <button type="button" onClick={addLink} className="px-3 py-1 rounded bg-zinc-800 text-sm">Link</button>
        <button type="button" onClick={addImage} className="px-3 py-1 rounded bg-zinc-800 text-sm">Image</button>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none p-6 min-h-[320px] bg-zinc-950 focus:outline-none"
      />
    </div>
  )
}
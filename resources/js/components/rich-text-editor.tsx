import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Bold, Italic, Underline, Strikethrough, 
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Quote, RotateCcw, RotateCw, RemoveFormatting, Code, Eye, Type, Palette
} from 'lucide-react';

interface RichTextEditorProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const FONT_FAMILIES = [
    { label: 'Default (Sans-Serif)', value: 'sans-serif' },
    { label: 'Official / Legal (Serif)', value: 'Georgia, Cambria, "Times New Roman", serif' },
    { label: 'Monospace (Clauses)', value: 'ui-monospace, Menlo, Monaco, Consolas, monospace' },
];

const FONT_SIZES = [
    { label: 'Small (12px)', value: '2' },
    { label: 'Normal (14px)', value: '3' },
    { label: 'Medium (16px)', value: '4' },
    { label: 'Large (18px)', value: '5' },
    { label: 'Extra Large (24px)', value: '6' },
];

const COLOR_PRESETS = [
    { label: 'Charcoal (Default)', value: '#1F2937' },
    { label: 'Theme Gold', value: '#D4A017' },
    { label: 'Emerald Green', value: '#059669' },
    { label: 'Royal Blue', value: '#2563EB' },
    { label: 'Crimson Red', value: '#DC2626' },
    { label: 'Muted Slate', value: '#64748B' },
];

export function RichTextEditor({
    id,
    value,
    onChange,
    placeholder = 'Compose rich content...',
    minHeight = '240px',
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
    const [htmlSource, setHtmlSource] = useState(value || '');
    const [selectedFont, setSelectedFont] = useState('sans-serif');
    const [selectedSize, setSelectedSize] = useState('3');
    const [selectedBlock, setSelectedBlock] = useState('p');
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Sync external value with editor content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
        setHtmlSource(value || '');
    }, [value]);

    const exec = (command: string, arg: string | undefined = undefined) => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, arg);
        handleInput();
    };

    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        setHtmlSource(html);
        onChange(html);
    };

    const handleHtmlSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nextVal = e.target.value;
        setHtmlSource(nextVal);
        onChange(nextVal);
        if (editorRef.current) {
            editorRef.current.innerHTML = nextVal;
        }
    };

    const handleFontFamily = (font: string) => {
        setSelectedFont(font);
        exec('fontName', font);
    };

    const handleFontSize = (size: string) => {
        setSelectedSize(size);
        exec('fontSize', size);
    };

    const handleFormatBlock = (block: string) => {
        setSelectedBlock(block);
        exec('formatBlock', `<${block}>`);
    };

    const handleColor = (color: string) => {
        exec('foreColor', color);
        setShowColorPicker(false);
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white focus-within:ring-2 focus-within:ring-[#D4A017]/30 focus-within:border-[#D4A017] transition-all">
            {/* Toolbar */}
            <div className="bg-gray-50/90 border-b border-gray-200 p-2 flex flex-wrap items-center justify-between gap-1.5 text-gray-700 select-none">
                <div className="flex flex-wrap items-center gap-1">
                    {/* Block type (Paragraph / Headings) */}
                    <div className="flex items-center">
                        <select
                            value={selectedBlock}
                            onChange={(e) => handleFormatBlock(e.target.value)}
                            disabled={viewMode === 'html'}
                            aria-label="Format Block"
                            className="h-8 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4A017] cursor-pointer disabled:opacity-50"
                        >
                            <option value="p">Normal Text</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                            <option value="blockquote">Quote Block</option>
                        </select>
                    </div>

                    {/* Font Family selector */}
                    <div className="flex items-center">
                        <select
                            value={selectedFont}
                            onChange={(e) => handleFontFamily(e.target.value)}
                            disabled={viewMode === 'html'}
                            aria-label="Font Family"
                            className="h-8 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4A017] cursor-pointer disabled:opacity-50"
                        >
                            {FONT_FAMILIES.map(f => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font Size selector */}
                    <div className="flex items-center">
                        <select
                            value={selectedSize}
                            onChange={(e) => handleFontSize(e.target.value)}
                            disabled={viewMode === 'html'}
                            aria-label="Font Size"
                            className="h-8 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4A017] cursor-pointer disabled:opacity-50"
                        >
                            {FONT_SIZES.map(s => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-5 w-px bg-gray-200 mx-0.5" />

                    {/* Basic Styles: Bold, Italic, Underline, Strike */}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            title="Bold (Ctrl+B)"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('bold')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Bold className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Italic (Ctrl+I)"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('italic')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Italic className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Underline (Ctrl+U)"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('underline')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Underline className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Strikethrough"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('strikeThrough')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Strikethrough className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="h-5 w-px bg-gray-200 mx-0.5" />

                    {/* Font Color Menu */}
                    <div className="relative">
                        <button
                            type="button"
                            title="Text Color"
                            disabled={viewMode === 'html'}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="h-8 px-2 flex items-center gap-1 rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer text-xs font-semibold"
                        >
                            <Palette className="h-3.5 w-3.5" />
                            <span>Color</span>
                        </button>

                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl p-2 shadow-lg flex flex-col gap-1 w-44">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Choose Color</span>
                                {COLOR_PRESETS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => handleColor(c.value)}
                                        className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: c.value }} />
                                        <span className="text-gray-700">{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-gray-200 mx-0.5" />

                    {/* Alignment */}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            title="Align Left"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('justifyLeft')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Align Center"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('justifyCenter')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <AlignCenter className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Align Right"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('justifyRight')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <AlignRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Justify"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('justifyFull')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <AlignJustify className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="h-5 w-px bg-gray-200 mx-0.5" />

                    {/* Lists */}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            title="Bullet List"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('insertUnorderedList')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Numbered List"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('insertOrderedList')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <ListOrdered className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Quote Block"
                            disabled={viewMode === 'html'}
                            onClick={() => handleFormatBlock('blockquote')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Quote className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="h-5 w-px bg-gray-200 mx-0.5" />

                    {/* Clear Format, Undo, Redo */}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            title="Clear Formatting"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('removeFormat')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RemoveFormatting className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Undo (Ctrl+Z)"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('undo')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Redo (Ctrl+Y)"
                            disabled={viewMode === 'html'}
                            onClick={() => exec('redo')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/70 text-gray-700 active:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Mode Switcher: Visual Editor vs HTML Source */}
                <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (viewMode === 'html' && editorRef.current) {
                                editorRef.current.innerHTML = htmlSource;
                            }
                            setViewMode('visual');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                            viewMode === 'visual'
                                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visual</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (editorRef.current) {
                                setHtmlSource(editorRef.current.innerHTML);
                            }
                            setViewMode('html');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                            viewMode === 'html'
                                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Code className="h-3.5 w-3.5" />
                        <span>HTML Source</span>
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            {viewMode === 'visual' ? (
                <div
                    id={id}
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onBlur={handleInput}
                    data-placeholder={placeholder}
                    style={{ minHeight }}
                    className="p-4 text-sm text-gray-800 outline-none leading-relaxed prose max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none overflow-y-auto"
                />
            ) : (
                <textarea
                    value={htmlSource}
                    onChange={handleHtmlSourceChange}
                    style={{ minHeight }}
                    className="w-full p-4 text-xs font-mono text-gray-800 outline-none leading-relaxed bg-gray-50/50 resize-y border-0 focus:ring-0"
                    placeholder="<p>Enter HTML markup directly...</p>"
                />
            )}
        </div>
    );
}

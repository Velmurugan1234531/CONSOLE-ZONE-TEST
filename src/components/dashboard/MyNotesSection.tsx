"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Loader2, StickyNote as NoteIcon, Save, X } from "lucide-react";
import { createNote, updateNote, deleteNote, subscribeToNotes, NoteDocument } from "@/services/notes";

interface MyNotesSectionProps {
    userId: string;
}

export default function MyNotesSection({ userId }: MyNotesSectionProps) {
    const [notes, setNotes] = useState<NoteDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: "", content: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToNotes(userId, (updatedNotes) => {
            setNotes(updatedNotes);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        setSaving(true);
        try {
            await createNote(userId, formData.title, formData.content);
            setFormData({ title: "", content: "" });
            setShowCreateForm(false);
        } catch (error) {
            alert("Failed to create note");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (noteId: string) => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        setSaving(true);
        try {
            await updateNote(userId, noteId, formData.title, formData.content);
            setEditingNote(null);
            setFormData({ title: "", content: "" });
        } catch (error) {
            alert("Failed to update note");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await deleteNote(userId, noteId);
        } catch (error) {
            alert("Failed to delete note");
        }
    };

    const startEdit = (note: NoteDocument) => {
        setEditingNote(note.id);
        setFormData({ title: note.title, content: note.content });
        setShowCreateForm(false);
    };

    const cancelEdit = () => {
        setEditingNote(null);
        setFormData({ title: "", content: "" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#A855F7]" size={32} />
            </div>
        );
    }

    return (
        <div>
            {/* Create Button */}
            <div className="mb-8">
                <button
                    onClick={() => {
                        setShowCreateForm(true);
                        setEditingNote(null);
                        setFormData({ title: "", content: "" });
                    }}
                    className="
                        flex items-center gap-2 px-6 py-3
                        bg-[#A855F7] hover:bg-[#9333EA]
                        text-white font-black uppercase tracking-[0.2em]
                        rounded-xl transition-all
                        shadow-[0_10px_30px_rgba(168,85,247,0.3)]
                    "
                >
                    <Plus size={20} />
                    Create Note
                </button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingNote) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <input
                        type="text"
                        placeholder="Note Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="
                            w-full bg-white/5 border border-white/10 rounded-lg
                            py-3 px-4 text-white placeholder:text-gray-600
                            focus:outline-none focus:border-[#A855F7]/50
                            mb-4 font-bold
                        "
                    />
                    <textarea
                        placeholder="Note Content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={6}
                        className="
                            w-full bg-white/5 border border-white/10 rounded-lg
                            py-3 px-4 text-white placeholder:text-gray-600
                            focus:outline-none focus:border-[#A855F7]/50
                            resize-none
                        "
                    />
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => editingNote ? handleUpdate(editingNote) : handleCreate()}
                            disabled={saving}
                            className="
                                flex items-center gap-2 px-6 py-2
                                bg-[#A855F7] hover:bg-[#9333EA]
                                text-white font-bold uppercase tracking-wider text-sm
                                rounded-lg transition-all
                                disabled:opacity-50
                            "
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : editingNote ? "Update" : "Save"}
                        </button>
                        <button
                            onClick={() => {
                                setShowCreateForm(false);
                                cancelEdit();
                            }}
                            className="
                                flex items-center gap-2 px-6 py-2
                                bg-white/5 hover:bg-white/10
                                border border-white/10
                                text-gray-400 hover:text-white font-bold uppercase tracking-wider text-sm
                                rounded-lg transition-all
                            "
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Notes Grid */}
            {notes.length === 0 ? (
                <div className="text-center py-20">
                    <NoteIcon className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-wider">No notes yet</p>
                    <p className="text-gray-600 text-sm mt-2">Create your first note to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note, index) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="
                                bg-white/5 border border-white/10 rounded-xl p-6
                                hover:bg-white/10 hover:border-[#A855F7]/50
                                transition-all group
                            "
                        >
                            <h3 className="text-white font-black text-lg mb-3 truncate">
                                {note.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-4">
                                {note.content}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEdit(note)}
                                    className="
                                        flex-1 flex items-center justify-center gap-2
                                        py-2 px-3 bg-[#A855F7]/20 hover:bg-[#A855F7]/30
                                        border border-[#A855F7]/30 rounded-lg
                                        text-[#A855F7] text-xs font-bold uppercase tracking-wider
                                        transition-all
                                    "
                                >
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="
                                        p-2 bg-red-500/20 hover:bg-red-500/30
                                        border border-red-500/30 rounded-lg
                                        text-red-500 transition-all
                                    "
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

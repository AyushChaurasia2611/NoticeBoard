import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Tag,
  X,
  Upload,
  Link2,
  Megaphone,
  BookOpen,
  CalendarDays,
  FileText,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  body: string;
  category: 'Exam' | 'Event' | 'General';
  priority: 'Urgent' | 'Normal';
  publishDate: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  // Notices states
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formBody, setFormBody] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'Exam' | 'Event' | 'General'>('General');
  const [formPriority, setFormPriority] = useState<'Urgent' | 'Normal'>('Normal');
  const [formPublishDate, setFormPublishDate] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete confirmation states
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notices');
      if (!res.ok) throw new Error('Failed to fetch notices');
      const data = await res.json();
      setNotices(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Set default publish date to today in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Open modal for creating new notice
  const openCreateModal = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormBody('');
    setFormCategory('General');
    setFormPriority('Normal');
    setFormPublishDate(getTodayDateString());
    setImageUrl('');
    setImageInputMethod('upload');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing notice
  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormBody(notice.body);
    setFormCategory(notice.category);
    setFormPriority(notice.priority);
    // Format publishDate to YYYY-MM-DD
    const dateStr = notice.publishDate.split('T')[0];
    setFormPublishDate(dateStr);
    setImageUrl(notice.imageUrl || '');
    setImageInputMethod(notice.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Handle local image file upload & resize via canvas
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 375;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality compression
          setImageUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Front-end Validations
    if (!formTitle.trim()) {
      setValidationError('Title is required.');
      return;
    }
    if (!formBody.trim()) {
      setValidationError('Content description is required.');
      return;
    }
    if (!formPublishDate) {
      setValidationError('Publish date is required.');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices';
      const method = editingNotice ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formTitle,
          body: formBody,
          category: formCategory,
          priority: formPriority,
          publishDate: formPublishDate,
          imageUrl: imageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save notice.');
      }

      setIsModalOpen(false);
      fetchNotices(); // Refresh list
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!noticeToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/notices/${noticeToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete notice.');
      }
      setNoticeToDelete(null);
      fetchNotices();
    } catch (err: any) {
      alert(err.message || 'An error occurred during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalNotices = notices.length;
  const urgentCount = notices.filter((n) => n.priority === 'Urgent').length;
  const examCount = notices.filter((n) => n.category === 'Exam').length;
  const eventCount = notices.filter((n) => n.category === 'Event').length;
  const generalCount = notices.filter((n) => n.category === 'General').length;

  // Search & Filtered notices listing
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || notice.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      <Head>
        <title>Notice Board | Reno Platforms</title>
        <meta name="description" content="Campus notice board manager for Reno Platforms." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Decorative Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header / Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 text-white animate-pulse">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">Reno Platforms</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">ENG</span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-tight">CAMPUS NOTICE BOARD</h1>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Notice</span>
          </button>
        </div>
      </header>

      {/* Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative">
        
        {/* Dashboard Statistics Overview */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Notices</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">{totalNotices}</span>
              <span className="text-[10px] text-slate-500 uppercase">active</span>
            </div>
          </div>
          <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:scale-150 transition" />
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              Urgent Priority
              {urgentCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-red-300">{urgentCount}</span>
              <span className="text-[10px] text-red-400/75 uppercase">notices</span>
            </div>
          </div>
          <div className="p-4 bg-amber-950/15 border border-amber-900/20 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Exams
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-300">{examCount}</span>
              <span className="text-[10px] text-amber-400/50">scheduled</span>
            </div>
          </div>
          <div className="p-4 bg-purple-950/15 border border-purple-900/20 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Events
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-purple-300">{eventCount}</span>
              <span className="text-[10px] text-purple-400/50">upcoming</span>
            </div>
          </div>
          <div className="p-4 bg-emerald-950/15 border border-emerald-900/20 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> General
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-300">{generalCount}</span>
              <span className="text-[10px] text-emerald-400/50">updates</span>
            </div>
          </div>
        </section>

        {/* Filter Toolbar */}
        <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notices by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none placeholder:text-slate-500 text-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:ring-0 outline-none cursor-pointer pr-1"
              >
                <option value="All" className="bg-slate-900">All Categories</option>
                <option value="Exam" className="bg-slate-900">Exams</option>
                <option value="Event" className="bg-slate-900">Events</option>
                <option value="General" className="bg-slate-900">General</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:ring-0 outline-none cursor-pointer pr-1"
              >
                <option value="All" className="bg-slate-900">All Priorities</option>
                <option value="Urgent" className="bg-slate-900">Urgent First</option>
                <option value="Normal" className="bg-slate-900">Normal Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notices Board Content Display */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading campus announcements...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-2xl text-center max-w-lg mx-auto mt-12">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-200 mb-1">Failed to connect</h3>
            <p className="text-xs text-red-400/90 mb-4">{error}</p>
            <button
              onClick={fetchNotices}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 transition text-xs font-semibold text-red-200 rounded-xl border border-red-700/30"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-20 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl max-w-xl mx-auto">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-bold text-base">No notices found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto px-4">
              {searchQuery || selectedCategory !== 'All' || selectedPriority !== 'All'
                ? 'Try resetting the search terms or category filter to reveal notices.'
                : 'The board is currently clear! Use "New Notice" to pin a new notice on the board.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map((notice) => (
              <article
                key={notice.id}
                className={`group bg-slate-950/40 border transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 rounded-2xl overflow-hidden flex flex-col justify-between ${
                  notice.priority === 'Urgent'
                    ? 'border-red-950/60 bg-red-950/5 hover:border-red-900/65 shadow-md shadow-red-900/5'
                    : 'border-slate-800/80 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div>
                  {/* Card Image Display */}
                  <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
                    {notice.imageUrl ? (
                      <img
                        src={notice.imageUrl}
                        alt={notice.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      // Creative abstract fallback vector depending on category
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center p-6 ${
                          notice.category === 'Exam'
                            ? 'bg-amber-950/10 text-amber-500/20'
                            : notice.category === 'Event'
                            ? 'bg-purple-950/10 text-purple-500/20'
                            : 'bg-indigo-950/10 text-indigo-500/20'
                        }`}
                      >
                        {notice.category === 'Exam' ? (
                          <BookOpen className="w-12 h-12 stroke-[1.5]" />
                        ) : notice.category === 'Event' ? (
                          <CalendarDays className="w-12 h-12 stroke-[1.5]" />
                        ) : (
                          <FileText className="w-12 h-12 stroke-[1.5]" />
                        )}
                        <span className="text-[10px] tracking-widest font-bold uppercase mt-2 opacity-50">
                          {notice.category}
                        </span>
                      </div>
                    )}

                    {/* Category Overlay tag */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-0.75 rounded-md uppercase border ${
                          notice.category === 'Exam'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                            : notice.category === 'Event'
                            ? 'bg-purple-950/70 text-purple-300 border-purple-800/50'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {notice.category}
                      </span>
                    </div>

                    {/* Urgent Overlay Badge */}
                    {notice.priority === 'Urgent' && (
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        <span className="text-[9px] font-bold tracking-widest bg-red-600/90 text-white px-1.8 py-0.5 rounded border border-red-500/30 uppercase">
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(notice.publishDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-white transition duration-200">
                      {notice.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mt-2.5 line-clamp-4 whitespace-pre-line">
                      {notice.body}
                    </p>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-900/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    ID: {notice.id.substring(0, 8)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(notice)}
                      className="p-2 hover:bg-slate-800/80 active:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNoticeToDelete(notice)}
                      className="p-2 hover:bg-red-950/40 active:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-lg transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Slide-over Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform bg-slate-900 border-l border-slate-800 shadow-2xl transition-all duration-300">
                <form onSubmit={handleFormSubmit} className="flex h-full flex-col justify-between overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="border-b border-slate-800 bg-slate-950/40 px-6 py-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {editingNotice ? 'Edit Notice Details' : 'Publish New Notice'}
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {editingNotice
                          ? 'Modify parameters below and save changes.'
                          : 'Fill in details to broadcast notice on the board.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Fields Body */}
                  <div className="flex-1 px-6 py-6 space-y-5">
                    {/* Display validation errors */}
                    {validationError && (
                      <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl flex gap-2 text-xs text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Notice Title */}
                    <div>
                      <label htmlFor="title" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Notice Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        maxLength={100}
                        placeholder="e.g. End Semester Exam Schedule 2026"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 placeholder:text-slate-600"
                      />
                    </div>

                    {/* Category & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="category"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 cursor-pointer"
                        >
                          <option value="General">General</option>
                          <option value="Exam">Exam</option>
                          <option value="Event">Event</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="priority" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                          Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="priority"
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 cursor-pointer"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Publish Date */}
                    <div>
                      <label htmlFor="publishDate" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Publish Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="publishDate"
                        required
                        value={formPublishDate}
                        onChange={(e) => setFormPublishDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 cursor-pointer"
                      />
                    </div>

                    {/* Notice Body Description */}
                    <div>
                      <label htmlFor="body" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="body"
                        required
                        rows={5}
                        placeholder="Write details about the exam schedules, venue, timing, and prerequisites..."
                        value={formBody}
                        onChange={(e) => setFormBody(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 placeholder:text-slate-600 resize-y min-h-[100px]"
                      />
                    </div>

                    {/* Bonus: Image input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Attach Header Image <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
                        </label>
                        {/* Selector toggle */}
                        <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setImageInputMethod('upload')}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition ${
                              imageInputMethod === 'upload' ? 'bg-indigo-650 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMethod('url')}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition ${
                              imageInputMethod === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Paste URL
                          </button>
                        </div>
                      </div>

                      {imageInputMethod === 'upload' ? (
                        <div className="flex flex-col gap-2">
                          <div className="relative border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl p-4 transition flex flex-col items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-5 h-5 text-slate-500 mb-1" />
                            <span className="text-xs text-slate-400 font-medium">Select Image File</span>
                            <span className="text-[9px] text-slate-600">Auto-compressed JPG formats</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="url"
                            placeholder="https://example.com/notice-image.jpg"
                            value={imageUrl.startsWith('data:') ? '' : imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition text-sm outline-none text-slate-200 placeholder:text-slate-600"
                          />
                        </div>
                      )}

                      {/* Preview Uploaded / Selected Image */}
                      {imageUrl && (
                        <div className="mt-3 relative border border-slate-800 rounded-xl overflow-hidden aspect-video bg-slate-950">
                          <img src={imageUrl} alt="Attachment preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="border-t border-slate-800 bg-slate-950/40 px-6 py-4 flex items-center justify-end gap-3 z-10">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 text-sm font-semibold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center min-w-[90px] px-5 py-2 bg-indigo-650 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingNotice ? (
                        'Save Changes'
                      ) : (
                        'Publish Notice'
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noticeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setNoticeToDelete(null)} />

          {/* Modal Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-950/80 text-red-500 rounded-xl border border-red-900/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Notice Deletion</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Danger Zone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete the notice <strong className="text-slate-100">"{noticeToDelete.title}"</strong>?
              This action is permanent and cannot be undone. It will be removed immediately from all databases.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNoticeToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex items-center justify-center min-w-[100px] px-5 py-2 bg-red-600 hover:bg-red-550 active:bg-red-700 disabled:bg-red-800 text-white text-xs font-semibold rounded-xl transition"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

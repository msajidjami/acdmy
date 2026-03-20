'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Filter, Edit, CheckCircle, XCircle, Eye, Copy, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Admission {
  _id: string;
  name: string;
  fatherName: string;
  email: string;
  contactNumber?: string;
  selectedCourse: string;
  currentStatus: string;
  courseCompleted: boolean;
  createdAt: string;
  assignedTeacher?: string;
  country?: string;
  gender?: string;
  platform?: string;
  referredByType?: 'owner' | 'teacher' | null;
  referralCode?: string;
  // Additional fields from the model
  dateOfBirth?: string;
  feeAmount?: number;
  feeCurrency?: string;
  preferredTiming?: string;
  additionalNotes?: string;
  classLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  adminNotes?: string;
  startDate?: string;
  completionDate?: string;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalCompletedCourses: number;
  todayAdmissions: number;
}

export default function AdminDashboard() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [courses, setCourses] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // فارم سٹیٹس
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', contactNumber: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', contactNumber: '' });
  const [addingOwner, setAddingOwner] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);

  const fetchAdmissions = async (newPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(courseFilter !== 'all' && { course: courseFilter }),
      });

      const res = await fetch(`/api/admission?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('ڈیٹا لوڈ نہیں ہوا');

      const data = await res.json();
      if (data.success) {
        const formatted = data.data.map((item: any) => ({
          _id: item._id,
          name: item.name || '',
          fatherName: item.fatherName || '',
          email: item.email || '',
          contactNumber: item.contactNumber || '',
          selectedCourse: item.selectedCourse || '',
          currentStatus: item.currentStatus || 'pending',
          courseCompleted: item.courseCompleted || false,
          createdAt: item.createdAt,
          assignedTeacher: item.assignedTeacher || '',
          country: item.country || '',
          gender: item.gender || '',
          platform: item.platform || 'whatsapp',
          referredByType: item.referredByType || null,
          referralCode: item.referralCode || '',
          // additional fields
          dateOfBirth: item.dateOfBirth,
          feeAmount: item.feeAmount,
          feeCurrency: item.feeCurrency,
          preferredTiming: item.preferredTiming,
          additionalNotes: item.additionalNotes,
          classLink: item.classLink,
          meetingId: item.meetingId,
          meetingPassword: item.meetingPassword,
          adminNotes: item.adminNotes,
          startDate: item.startDate,
          completionDate: item.completionDate,
        }));

        setAdmissions(formatted);
        setStats(data.stats);
        setCourses(data.filters?.courses || []);
        setTeachers(data.filters?.teachers || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(newPage);
      }
    } catch (err) {
      toast.error('ڈیٹا لوڈ کرنے میں مسئلہ');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnersAndTeachers = async () => {
    try {
      const [ownerRes, teacherRes] = await Promise.all([
        fetch('/api/admin/owner'),
        fetch('/api/admin/teacher')
      ]);

      if (ownerRes.ok) {
        const ownerData = await ownerRes.json();
        if (ownerData.success) setOwners(ownerData.data);
      }

      if (teacherRes.ok) {
        const teacherData = await teacherRes.json();
        if (teacherData.success) setTeachersList(teacherData.data);
      }
    } catch (err) {
      console.error('اونرز/ٹیچرز لوڈ نہیں ہوئے');
    }
  };

  useEffect(() => {
    fetchAdmissions(1);
    fetchOwnersAndTeachers();
  }, []);

  const handleSearch = () => fetchAdmissions(1);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { currentStatus: newStatus } }),
      });

      if (res.ok) {
        toast.success('اسٹیٹس اپ ڈیٹ ہو گیا');
        fetchAdmissions(page);
      }
    } catch (error) {
      toast.error('اسٹیٹس اپ ڈیٹ نہیں ہوا');
    }
  };

  const handleTeacherUpdate = async (id: string, teacher: string) => {
    try {
      const res = await fetch(`/api/admission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: { assignedTeacher: teacher || null }
        }),
      });

      if (res.ok) {
        toast.success('استاد تبدیل ہو گیا');
        fetchAdmissions(page);
      }
    } catch (error) {
      toast.error('استاد تبدیل نہیں ہوا');
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingOwner(true);
    try {
      const res = await fetch('/api/admin/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerForm),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`اونر شامل ہو گیا! کوڈ: ${result.data.referralCode}`);
        setOwners(prev => [...prev, result.data]);
        setOwnerForm({ name: '', email: '', contactNumber: '' });
      } else {
        toast.error(result.message || 'اونر شامل نہیں ہوا');
      }
    } catch (err) {
      toast.error('غلطی ہوئی');
    } finally {
      setAddingOwner(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTeacher(true);
    try {
      const res = await fetch('/api/admin/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`ٹیچر شامل ہو گیا! کوڈ: ${result.data.referralCode}`);
        setTeachersList(prev => [...prev, result.data]);
        setTeacherForm({ name: '', email: '', contactNumber: '' });
      } else {
        toast.error(result.message || 'ٹیچر شامل نہیں ہوا');
      }
    } catch (err) {
      toast.error('غلطی ہوئی');
    } finally {
      setAddingTeacher(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('لنک کاپی ہو گیا!');
  };

  const handleViewDetails = (admission: Admission) => {
    setSelectedAdmission(admission);
    setShowDetailsModal(true);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      enrolled: 'bg-indigo-100 text-indigo-800',
      dropped: 'bg-red-100 text-red-800',
      pending: 'bg-amber-100 text-amber-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: 'زیر التوا',
      contacted: 'رابطہ ہوا',
      enrolled: 'انرول ہوا',
      'in-progress': 'جاری',
      completed: 'مکمل',
      dropped: 'منسوخ'
    };
    return map[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">کل طلباء</p>
            <p className="text-2xl font-bold text-teal-600">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">زیر التوا</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">جاری</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">مکمل</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">کورس مکمل</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalCompletedCourses}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-600 text-sm">آج کے</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.todayAdmissions}</p>
          </div>
        </div>
      )}

      {/* اونر اور ٹیچر ایڈ فارم */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* اونر فارم */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold text-teal-700 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> نیا اونر شامل کریں
          </h3>
          <form onSubmit={handleAddOwner} className="space-y-4">
            <input type="text" placeholder="نام" value={ownerForm.name} onChange={e => setOwnerForm({...ownerForm, name: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <input type="email" placeholder="ای میل" value={ownerForm.email} onChange={e => setOwnerForm({...ownerForm, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <input type="tel" placeholder="رابطہ نمبر" value={ownerForm.contactNumber} onChange={e => setOwnerForm({...ownerForm, contactNumber: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <button type="submit" disabled={addingOwner} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg flex items-center justify-center gap-2">
              {addingOwner ? <Loader2 className="animate-spin" /> : 'اونر شامل کریں'}
            </button>
          </form>
        </div>

        {/* ٹیچر فارم */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> نیا ٹیچر شامل کریں
          </h3>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <input type="text" placeholder="نام" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <input type="email" placeholder="ای میل" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <input type="tel" placeholder="رابطہ نمبر" value={teacherForm.contactNumber} onChange={e => setTeacherForm({...teacherForm, contactNumber: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
            <button type="submit" disabled={addingTeacher} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg flex items-center justify-center gap-2">
              {addingTeacher ? <Loader2 className="animate-spin" /> : 'ٹیچر شامل کریں'}
            </button>
          </form>
        </div>
      </div>

      {/* اونرز اور ٹیچرز کی لسٹ */}
      {(owners.length > 0 || teachersList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {owners.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-bold mb-4 text-teal-700">اونرز کی لسٹ</h3>
              <div className="space-y-3">
                {owners.map((owner) => (
                  <div key={owner._id} className="border border-teal-200 rounded-lg p-4 flex justify-between items-center bg-teal-50">
                    <div>
                      <p className="font-semibold">{owner.name}</p>
                      <p className="text-sm text-gray-600">{owner.email} | {owner.contactNumber}</p>
                      <p className="text-sm font-medium text-teal-600 mt-1">ریفرل کوڈ: {owner.referralCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`https://yoursite.com/admission?ref=${owner.referralCode}`)}
                      className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-lg"
                      title="ریفرل لنک کاپی کریں"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {teachersList.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-bold mb-4 text-purple-700">ٹیچرز کی لسٹ</h3>
              <div className="space-y-3">
                {teachersList.map((teacher) => (
                  <div key={teacher._id} className="border border-purple-200 rounded-lg p-4 flex justify-between items-center bg-purple-50">
                    <div>
                      <p className="font-semibold">{teacher.name}</p>
                      <p className="text-sm text-gray-600">{teacher.email} | {teacher.contactNumber}</p>
                      <p className="text-sm font-medium text-purple-600 mt-1">ریفرل کوڈ: {teacher.referralCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`https://yoursite.com/admission?ref=${teacher.referralCode}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg"
                      title="ریفرل لنک کاپی کریں"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* فلٹرز */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="نام، ای میل، فون، کورس سرچ کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchAdmissions(1); }} className="px-4 py-3 border rounded-lg">
            <option value="all">تمام اسٹیٹس</option>
            <option value="pending">زیر التوا</option>
            <option value="contacted">رابطہ ہوا</option>
            <option value="enrolled">انرول ہوا</option>
            <option value="in-progress">جاری</option>
            <option value="completed">مکمل</option>
            <option value="dropped">منسوخ</option>
          </select>

          <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); fetchAdmissions(1); }} className="px-4 py-3 border rounded-lg">
            <option value="all">تمام کورسز</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2">
            <Filter className="w-5 h-5" /> فلٹر کریں
          </button>
        </div>
      </div>

      {/* ٹیبل */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">لوڈ ہو رہا ہے...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">نام</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">والد کا نام</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">ای میل / رابطہ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">کورس</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">ریفرل سورس</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">استاد</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">اسٹیٹس</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">تاریخ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">عمل</th>
                </tr>
              </thead>
              <tbody>
                {admissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">کوئی طالب علم نہیں ملا</td>
                  </tr>
                ) : (
                  admissions.map((adm) => (
                    <tr key={adm._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-right">{adm.name}</td>
                      <td className="px-6 py-4 text-sm text-right">{adm.fatherName}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="font-medium">{adm.email}</div>
                        {adm.contactNumber && <div className="text-gray-500">{adm.contactNumber}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">{adm.selectedCourse}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        {adm.referredByType ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${adm.referredByType === 'owner' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}`}>
                            {adm.referredByType === 'owner' ? 'اونر' : 'ٹیچر'} ({adm.referralCode})
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <select
                          value={adm.assignedTeacher || ''}
                          onChange={(e) => handleTeacherUpdate(adm._id, e.target.value)}
                          className="text-xs border rounded px-3 py-2 bg-white"
                        >
                          <option value="">کوئی نہیں</option>
                          {teachers.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(adm.currentStatus)}`}>
                          {getStatusText(adm.currentStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">
                        {new Date(adm.createdAt).toLocaleDateString('ur-PK')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleViewDetails(adm)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="تفصیلات">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStatusUpdate(adm._id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="مکمل">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStatusUpdate(adm._id, 'in-progress')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="جاری">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => page > 1 && fetchAdmissions(page - 1)}
                disabled={page === 1}
                className="px-6 py-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                پچھلا
              </button>
              <span className="text-gray-700 font-medium">
                صفحہ {page} از {totalPages}
              </span>
              <button
                onClick={() => page < totalPages && fetchAdmissions(page + 1)}
                disabled={page === totalPages}
                className="px-6 py-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                اگلا
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal - اب تمام فیلڈز دکھائے جائیں گے */}
      {showDetailsModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">طالب علم کی تفصیلات</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* ذاتی معلومات */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-teal-700 border-b pb-2 mb-4">ذاتی معلومات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="نام" value={selectedAdmission.name} />
                  <DetailItem label="والد کا نام" value={selectedAdmission.fatherName} />
                  <DetailItem label="تاریخ پیدائش" value={formatDate(selectedAdmission.dateOfBirth)} />
                  <DetailItem label="جنس" value={selectedAdmission.gender === 'male' ? 'مرد' : selectedAdmission.gender === 'female' ? 'خاتون' : 'دیگر'} />
                  <DetailItem label="ملک" value={selectedAdmission.country || 'دستیاب نہیں'} />
                  <DetailItem label="ای میل" value={selectedAdmission.email} />
                  <DetailItem label="واٹس ایپ نمبر" value={selectedAdmission.contactNumber || 'دستیاب نہیں'} />
                </div>
              </div>

              {/* کورس سے متعلق معلومات */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-teal-700 border-b pb-2 mb-4">کورس کی تفصیلات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="منتخب کورس" value={selectedAdmission.selectedCourse} />
                  <DetailItem label="فیس" value={selectedAdmission.feeAmount ? `${selectedAdmission.feeAmount} ${selectedAdmission.feeCurrency || 'PKR'}` : '—'} />
                  <DetailItem label="ترجیحی وقت" value={selectedAdmission.preferredTiming || '—'} />
                  <DetailItem label="پلیٹ فارم" value={selectedAdmission.platform || 'واٹس ایپ'} />
                  <DetailItem label="کلاس لنک" value={selectedAdmission.classLink ? <a href={selectedAdmission.classLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">لنک</a> : '—'} />
                  <DetailItem label="میٹنگ آئی ڈی" value={selectedAdmission.meetingId || '—'} />
                  <DetailItem label="میٹنگ پاس ورڈ" value={selectedAdmission.meetingPassword || '—'} />
                  <DetailItem label="شروع کرنے کی تاریخ" value={formatDate(selectedAdmission.startDate)} />
                  <DetailItem label="مکمل کرنے کی تاریخ" value={formatDate(selectedAdmission.completionDate)} />
                  <DetailItem label="کورس مکمل" value={selectedAdmission.courseCompleted ? 'ہاں' : 'نہیں'} />
                </div>
              </div>

              {/* انتظامی معلومات */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-teal-700 border-b pb-2 mb-4">انتظامی معلومات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="موجودہ اسٹیٹس" value={getStatusText(selectedAdmission.currentStatus)} />
                  <DetailItem label="تفویض کردہ استاد" value={selectedAdmission.assignedTeacher || 'کوئی نہیں'} />
                  <DetailItem label="ریفرل سورس" value={selectedAdmission.referredByType ? `${selectedAdmission.referredByType === 'owner' ? 'اونر' : 'ٹیچر'} (${selectedAdmission.referralCode})` : 'کوئی نہیں'} />
                  <DetailItem label="تاریخ اندراج" value={formatDate(selectedAdmission.createdAt)} />
                  <DetailItem label="انتظامی نوٹس" value={selectedAdmission.adminNotes || '—'} />
                </div>
              </div>

              {/* اضافی نوٹس */}
              {selectedAdmission.additionalNotes && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-teal-700 border-b pb-2 mb-4">اضافی نوٹس (طالب علم کی طرف سے)</h4>
                  <p className="bg-gray-50 p-4 rounded-lg text-gray-700">{selectedAdmission.additionalNotes}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => setShowDetailsModal(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  بند کریں
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${selectedAdmission.email}`}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  ای میل بھیجیں
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <p className="mt-1 text-lg text-gray-800 font-medium">{value}</p>
    </div>
  );
}
// اب درست کیا 
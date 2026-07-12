import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  User,
  Trash2,
  Edit2,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';

const Bookings = () => {
  const { user } = useAuth();
  
  // Lists states
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [resourceBookings, setResourceBookings] = useState([]);
  
  // UI states
  const [selectedResource, setSelectedResource] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  // Modal/reschedule states
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [targetBooking, setTargetBooking] = useState(null);
  const [newTimes, setNewTimes] = useState({ start_time: '', end_time: '' });

  // Add Resource Modal states
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'room', description: '', status: 'Active' });

  // Booking form states
  const [bookingForm, setBookingForm] = useState({
    start_time: '',
    end_time: '',
    booked_for_type: 'employee',
    department_id: ''
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, bookRes] = await Promise.all([
        api.get('/resources'),
        api.get('/resources/bookings')
      ]);

      if (resRes.data.success) {
        setResources(resRes.data.resources);
        if (resRes.data.resources.length > 0 && !selectedResource) {
          setSelectedResource(resRes.data.resources[0]);
        }
      }
      if (bookRes.data.success) {
        setMyBookings(bookRes.data.bookings);
      }
    } catch (error) {
      console.error('Error loading booking data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedResourceBookings = async (resourceId) => {
    if (!resourceId) return;
    try {
      const res = await api.get(`/resources/${resourceId}/bookings`);
      if (res.data.success) {
        setResourceBookings(res.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching calendar bookings:', error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      fetchSelectedResourceBookings(selectedResource.id);
    }
  }, [selectedResource]);

  // Handle resource selection
  const handleResourceSelect = (res) => {
    setSelectedResource(res);
  };

  // Submit booking
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResource) return;

    try {
      const payload = {
        resource_id: selectedResource.id,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        booked_for_type: bookingForm.booked_for_type
      };

      if (bookingForm.booked_for_type === 'department') {
        payload.department_id = user.department_id;
      }

      const res = await api.post('/resources/book', payload);
      if (res.data.success) {
        showFeedback('success', 'Resource slot booked successfully!');
        setBookingForm({
          start_time: '',
          end_time: '',
          booked_for_type: 'employee',
          department_id: ''
        });
        fetchData();
        if (selectedResource) fetchSelectedResourceBookings(selectedResource.id);
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to book slot.');
    }
  };

  // Add Resource Handler (Admin/Manager)
  const handleAddResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/resources', resourceForm);
      if (res.data.success) {
        showFeedback('success', 'New booking resource registered.');
        setResourceForm({ name: '', type: 'room', description: '', status: 'Active' });
        setAddResourceOpen(false);
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to add resource.');
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.post(`/resources/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        showFeedback('success', 'Booking cancelled successfully.');
        fetchData();
        if (selectedResource) fetchSelectedResourceBookings(selectedResource.id);
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  // Open Reschedule Modal
  const openReschedule = (booking) => {
    setTargetBooking(booking);
    setNewTimes({
      start_time: booking.start_time.substring(0, 16),
      end_time: booking.end_time.substring(0, 16)
    });
    setRescheduleOpen(true);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!targetBooking) return;

    try {
      const res = await api.put(`/resources/bookings/${targetBooking.id}/reschedule`, newTimes);
      if (res.data.success) {
        showFeedback('success', 'Booking rescheduled successfully!');
        setRescheduleOpen(false);
        setTargetBooking(null);
        fetchData();
        if (selectedResource) fetchSelectedResourceBookings(selectedResource.id);
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Rescheduling error: Time slot conflict.');
    }
  };

  // Format Helper
  const formatTimeRange = (start, end) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    return `${sDate.toLocaleDateString()} ${sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getResourceTypeLabel = (type) => {
    const mapping = { room: 'Meeting Room', vehicle: 'Company Vehicle', equipment: 'Shared Equipment' };
    return mapping[type] || type;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Resource Booking
          </h1>
          <p className="text-slate-400 mt-1">Book shared conference rooms, company vehicles, and office equipment without overlap conflicts.</p>
        </div>

        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'asset_manager') && (
            <button
              onClick={() => setAddResourceOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'browse' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Browse & Book
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'my-bookings' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          My Reservations
          {myBookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-500 text-[10px] text-white font-bold">
              {myBookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB A: BROWSE & BOOK */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Resource Directory Menu (Sidebar left) */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Resource</h2>
            {resources.length === 0 ? (
              <p className="text-xs text-slate-600 py-6 text-center">No resources configured.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleResourceSelect(res)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedResource?.id === res.id
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 font-bold'
                        : 'bg-slate-900/30 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <p className="text-sm font-bold">{res.name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">{getResourceTypeLabel(res.type)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar View & New Booking form (main area center + right) */}
          <div className="lg:col-span-3 space-y-8">
            {selectedResource ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Book Form (1 column) */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 h-fit">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Book Time Slot</h2>
                  <form onSubmit={handleBookSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={bookingForm.start_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                        className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={bookingForm.end_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                        className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                      />
                    </div>

                    {user?.role === 'dept_head' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Booked On Behalf Of</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="bookType"
                              checked={bookingForm.booked_for_type === 'employee'}
                              onChange={() => setBookingForm({ ...bookingForm, booked_for_type: 'employee' })}
                              className="text-purple-600 focus:ring-purple-500 h-4 w-4 bg-slate-900 border-slate-800"
                            />
                            Myself
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="bookType"
                              checked={bookingForm.booked_for_type === 'department'}
                              onChange={() => setBookingForm({ ...bookingForm, booked_for_type: 'department' })}
                              className="text-purple-600 focus:ring-purple-500 h-4 w-4 bg-slate-900 border-slate-800"
                            />
                            My Department
                          </label>
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn-primary w-full py-2 text-xs mt-4">
                      Submit Reservation
                    </button>
                  </form>
                </div>

                {/* Resource Calendar List (2 columns) */}
                <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Scheduled Bookings</h2>
                      <p className="text-[10px] text-purple-400 font-bold capitalize mt-0.5">{selectedResource.name} - {getResourceTypeLabel(selectedResource.type)}</p>
                    </div>
                  </div>

                  {resourceBookings.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      No active bookings scheduled for this resource. Feel free to reserve!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {resourceBookings.map((b) => (
                        <div 
                          key={b.id} 
                          className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                            b.status === 'Cancelled'
                              ? 'bg-transparent border-slate-900 text-slate-600'
                              : b.status === 'Ongoing'
                              ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200'
                              : 'bg-slate-900/40 border-slate-900 text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              {formatTimeRange(b.start_time, b.end_time)}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Booked by: <strong className="text-slate-400">{b.booked_by_name}</strong>
                              {b.department_name && <span className="ml-1 text-[10px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded">Dept: {b.department_name}</span>}
                            </p>
                          </div>
                          
                          <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${
                            b.status === 'Cancelled' ? 'bg-slate-500/10 text-slate-500' :
                            b.status === 'Ongoing' ? 'bg-indigo-500/10 text-indigo-400' :
                            b.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="glass-card py-20 text-center text-slate-500 rounded-2xl border border-slate-900">
                Choose a resource from the menu to review scheduling.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB B: MY RESERVATIONS */}
      {activeTab === 'my-bookings' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-6 font-semibold">My Reservation List</h2>
          {myBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              You haven't booked any resources yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Resource</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Scheduled Slot Time</th>
                    <th className="py-3 px-4 font-bold">Scope</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {myBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-bold text-slate-200">{b.resource_name}</td>
                      <td className="py-4 px-4 uppercase text-[10px] font-bold text-slate-500">{getResourceTypeLabel(b.resource_type)}</td>
                      <td className="py-4 px-4 text-slate-300 font-bold">{formatTimeRange(b.start_time, b.end_time)}</td>
                      <td className="py-4 px-4 text-slate-400 capitalize">
                        {b.booked_for_type === 'department' ? (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                            Dept: {b.department_name}
                          </span>
                        ) : (
                          'Personal'
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'Cancelled' ? 'bg-slate-500/10 text-slate-500 border border-slate-800' :
                          b.status === 'Ongoing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          b.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {(b.status === 'Upcoming' || b.status === 'Ongoing') && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openReschedule(b)}
                              className="p-1.5 hover:bg-slate-800 hover:text-purple-400 text-slate-400 rounded-lg cursor-pointer"
                              title="Reschedule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="p-1.5 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 rounded-lg cursor-pointer"
                              title="Cancel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: RESCHEDULE BOOKING */}
      {rescheduleOpen && targetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setRescheduleOpen(false)} />
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Reschedule Booking
              </h2>
              <button onClick={() => setRescheduleOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Reschedule slot for: <strong>{targetBooking.resource_name}</strong>. Overlap conflict checks will run.
              </p>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTimes.start_time}
                  onChange={(e) => setNewTimes({ ...newTimes, start_time: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTimes.end_time}
                  onChange={(e) => setNewTimes({ ...newTimes, end_time: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs px-6"
                >
                  Save Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: REGISTER ADD RESOURCE (Admin/Manager only) */}
      {addResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setAddResourceOpen(false)} />
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                Register Shared Resource
              </h2>
              <button onClick={() => setAddResourceOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddResourceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resource Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conference Room A1"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resource Type</label>
                <select
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="room">Meeting Room</option>
                  <option value="vehicle">Company Vehicle</option>
                  <option value="equipment">Shared Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Capacity, configurations, specs details, location..."
                  rows="3"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setAddResourceOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs px-6"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Bookings;

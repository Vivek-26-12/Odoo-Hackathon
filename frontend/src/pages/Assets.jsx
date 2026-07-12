import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  Plus, 
  Search, 
  FileText, 
  History, 
  QrCode, 
  Upload, 
  Info,
  Calendar,
  MapPin,
  Tag,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  ExternalLink
} from 'lucide-react';

const Assets = () => {
  const { user } = useAuth();
  
  // Search & Filters state
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isSharedFilter, setIsSharedFilter] = useState('');
  const [qrCodeSim, setQrCodeSim] = useState('');
  
  // Modal states
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  
  // Form states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetPhoto, setAssetPhoto] = useState(null);
  
  const [assetForm, setAssetForm] = useState({
    name: '',
    category_id: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: '',
    condition_status: 'New',
    location: '',
    is_shared: false,
    custom_fields: {}
  });

  // Fetch initial master lists
  const fetchMasterData = async () => {
    try {
      const [catsRes, deptsRes] = await Promise.all([
        api.get('/org/categories'),
        api.get('/org/departments')
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.categories);
      if (deptsRes.data.success) setDepartments(deptsRes.data.departments);
    } catch (error) {
      console.error('Error fetching master filters:', error.message);
    }
  };

  // Fetch assets list based on current filters
  const fetchAssets = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCat) params.category_id = selectedCat;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDept) params.department_id = selectedDept;
      if (isSharedFilter !== '') params.is_shared = isSharedFilter;

      const res = await api.get('/assets', { params });
      if (res.data.success) {
        setAssets(res.data.assets);
      }
    } catch (error) {
      console.error('Error fetching assets directory:', error.message);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [search, selectedCat, selectedStatus, selectedDept, isSharedFilter]);

  // Handle category change in form (to dynamically load custom schema fields)
  const handleFormCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = categories.find(c => c.id === parseInt(catId, 10));
    
    // Initialize custom field values
    const customFieldsObj = {};
    if (cat && cat.fields) {
      cat.fields.forEach(f => {
        customFieldsObj[f.name] = '';
      });
    }

    setAssetForm({
      ...assetForm,
      category_id: catId,
      custom_fields: customFieldsObj
    });
  };

  // Handle custom dynamic input changes
  const handleCustomFieldChange = (fieldName, value) => {
    setAssetForm({
      ...assetForm,
      custom_fields: {
        ...assetForm.custom_fields,
        [fieldName]: value
      }
    });
  };

  // Submit asset registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      // Setup Form Data to support image upload
      const formData = new FormData();
      formData.append('name', assetForm.name);
      formData.append('category_id', assetForm.category_id);
      formData.append('serial_number', assetForm.serial_number);
      formData.append('acquisition_date', assetForm.acquisition_date);
      formData.append('acquisition_cost', assetForm.acquisition_cost);
      formData.append('condition_status', assetForm.condition_status);
      formData.append('location', assetForm.location);
      formData.append('is_shared', assetForm.is_shared);
      formData.append('custom_fields', JSON.stringify(assetForm.custom_fields));
      
      if (assetPhoto) {
        formData.append('photo', assetPhoto);
      }

      const res = await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFormSuccess(`Asset registered successfully with tag ${res.data.asset.asset_tag}!`);
        // Reset form
        setAssetForm({
          name: '',
          category_id: '',
          serial_number: '',
          acquisition_date: '',
          acquisition_cost: '',
          condition_status: 'New',
          location: '',
          is_shared: false,
          custom_fields: {}
        });
        setAssetPhoto(null);
        fetchAssets();
        setTimeout(() => setRegisterOpen(false), 2000);
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error registering asset.');
    } finally {
      setLoading(false);
    }
  };

  // Open asset details modal
  const openDetails = (asset) => {
    setSelectedAsset(asset);
    setDetailsOpen(true);
  };

  // Open asset activity log / history modal
  const openHistory = async (asset) => {
    setSelectedAsset(asset);
    setHistoryOpen(true);
    try {
      const res = await api.get(`/assets/${asset.id}/history`);
      if (res.data.success) {
        setAssetHistory(res.data.history);
      }
    } catch (error) {
      console.error('Error fetching asset logs:', error.message);
    }
  };

  // Simulate QR Code scanning
  const handleQrSimulate = () => {
    if (!qrCodeSim.trim()) return;
    const match = assets.find(
      a => a.asset_tag.toLowerCase() === qrCodeSim.trim().toLowerCase() ||
           a.serial_number.toLowerCase() === qrCodeSim.trim().toLowerCase()
    );
    if (match) {
      openDetails(match);
      setQrCodeSim('');
    } else {
      alert('No matching Asset Tag or Serial Number found in directory.');
    }
  };

  // Helper for color coding asset status
  const getStatusBadge = (status) => {
    const mapping = {
      'Available': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'Allocated': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'Reserved': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      'Under Maintenance': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'Lost': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'Retired': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      'Disposed': 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    };
    return mapping[status] || 'bg-slate-500/15 text-slate-400';
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent animate-fade-in">
            Asset Registry Directory
          </h1>
          <p className="text-slate-400 mt-1">Register, track, filter and review asset lifecycles and historical details.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Simulate QR Code Scanner */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
            <QrCode className="w-4 h-4 text-purple-400 mr-2" />
            <input
              type="text"
              placeholder="Simulate QR tag / Serial"
              value={qrCodeSim}
              onChange={(e) => setQrCodeSim(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs w-36 text-slate-300 py-1.5 focus:ring-0"
            />
            <button
              onClick={handleQrSimulate}
              className="ml-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
            >
              Scan
            </button>
          </div>

          {(user?.role === 'admin' || user?.role === 'asset_manager') && (
            <button
              onClick={() => setRegisterOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
            >
              <Plus className="w-4 h-4" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Directory Searching & Filtering Grid */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Tag, Name, Serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full glass-input px-4 py-2 rounded-xl text-xs"
          >
            <option value="">-- All Categories --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full glass-input px-4 py-2 rounded-xl text-xs"
          >
            <option value="">-- All States --</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
            <option value="Disposed">Disposed</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full glass-input px-4 py-2 rounded-xl text-xs"
          >
            <option value="">-- All Holder Departments --</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Shared / Bookable Filter */}
          <select
            value={isSharedFilter}
            onChange={(e) => setIsSharedFilter(e.target.value)}
            className="w-full glass-input px-4 py-2 rounded-xl text-xs"
          >
            <option value="">-- Shared & Dedicated --</option>
            <option value="true">Shared / Bookable Only</option>
            <option value="false">Dedicated/Assigned Only</option>
          </select>

        </div>
      </div>

      {/* Directory Grid View */}
      {assets.length === 0 ? (
        <div className="glass-card py-20 text-center text-slate-500 rounded-2xl border border-slate-900">
          <Info className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-sm">No assets match the search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className="glass-card rounded-2xl border border-slate-900 overflow-hidden flex flex-col group hover:border-slate-800 transition-all duration-300"
            >
              {/* Asset Header Image */}
              <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-900/60">
                {asset.photo_url ? (
                  <img 
                    src={asset.photo_url} 
                    alt={asset.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <Tag className="w-12 h-12 mb-2 stroke-[1.2]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Photo Uploaded</span>
                  </div>
                )}

                {/* Status Badge Tag */}
                <span className={`absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md ${getStatusBadge(asset.status)}`}>
                  {asset.status}
                </span>

                {/* Bookable indicator */}
                {asset.is_shared === 1 && (
                  <span className="absolute bottom-4 left-4 text-[9px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/30 backdrop-blur-md">
                    Shared Bookable
                  </span>
                )}
              </div>

              {/* Asset Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{asset.asset_tag}</span>
                    <span>{asset.category_name}</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-base mt-2 group-hover:text-purple-400 transition-colors">{asset.name}</h3>
                  
                  {/* Metadata points */}
                  <div className="space-y-1.5 mt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{asset.location}</span>
                    </div>
                    {asset.status === 'Allocated' && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Held by: <strong>{asset.current_holder_name || asset.current_dept_name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-900/60">
                  <button
                    onClick={() => openDetails(asset)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    onClick={() => openHistory(asset)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/40 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-purple-400 transition-all cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    Logs
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 3. MODAL: REGISTER ASSET */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setRegisterOpen(false)} />
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" />
                Register New Asset
              </h2>
              <button onClick={() => setRegisterOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6">
              
              {/* Form Status Messages */}
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {formSuccess}
                </div>
              )}

              {/* Form Grid inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Asset Name</label>
                  <input
                    type="text"
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder="e.g. Dell Latitude 5420"
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    required
                    value={assetForm.category_id}
                    onChange={handleFormCategoryChange}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={assetForm.serial_number}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                    placeholder="e.g. SN-87612384A"
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquisition Location</label>
                  <input
                    type="text"
                    required
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    placeholder="e.g. Bangalore Office, Room 402"
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquisition Date</label>
                  <input
                    type="date"
                    required
                    value={assetForm.acquisition_date}
                    onChange={(e) => setAssetForm({ ...assetForm, acquisition_date: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquisition Cost (USD)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={assetForm.acquisition_cost}
                    onChange={(e) => setAssetForm({ ...assetForm, acquisition_cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Condition</label>
                  <select
                    value={assetForm.condition_status}
                    onChange={(e) => setAssetForm({ ...assetForm, condition_status: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="flex items-center h-full pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetForm.is_shared}
                      onChange={(e) => setAssetForm({ ...assetForm, is_shared: e.target.checked })}
                      className="rounded border-slate-800 text-purple-600 focus:ring-purple-500 bg-slate-900 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-300 select-none">Mark as Shared / Bookable Resource</span>
                  </label>
                </div>

              </div>

              {/* Dynamic Category Specific Inputs fields */}
              {assetForm.category_id && (
                (() => {
                  const cat = categories.find(c => c.id === parseInt(assetForm.category_id, 10));
                  if (!cat || !cat.fields || cat.fields.length === 0) return null;
                  return (
                    <div className="space-y-4 border-t border-slate-900 pt-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category-Specific Specifications ({cat.name})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                        {cat.fields.map((f) => (
                          <div key={f.name}>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{f.label}</label>
                            <input
                              type={f.type || 'text'}
                              value={assetForm.custom_fields[f.name] || ''}
                              onChange={(e) => handleCustomFieldChange(f.name, e.target.value)}
                              className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                              placeholder={`Enter ${f.label}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Photo Upload Attachment */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Photo</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">
                        {assetPhoto ? assetPhoto.name : 'Click to upload image'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAssetPhoto(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-2 text-xs px-6"
                >
                  {loading ? 'Registering...' : 'Register Asset'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: ASSET DETAILS VIEW */}
      {detailsOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDetailsOpen(false)} />
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{selectedAsset.asset_tag}</span>
                <h2 className="text-base font-bold text-slate-100 mt-1.5">{selectedAsset.name}</h2>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Asset Photo */}
              {selectedAsset.photo_url && (
                <div className="h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-900">
                  <img src={selectedAsset.photo_url} alt={selectedAsset.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-900 pb-4">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">State Status</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Category</span>
                  <span className="text-slate-200 font-semibold">{selectedAsset.category_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Serial Number</span>
                  <span className="text-slate-200 font-mono font-semibold">{selectedAsset.serial_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Registered Location</span>
                  <span className="text-slate-200 font-semibold">{selectedAsset.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Acquisition Date</span>
                  <span className="text-slate-200 font-semibold">{new Date(selectedAsset.acquisition_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Cost Value</span>
                  <span className="text-slate-200 font-semibold">${parseFloat(selectedAsset.acquisition_cost).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Condition</span>
                  <span className="text-slate-200 font-semibold">{selectedAsset.condition_status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Resource Type</span>
                  <span className="text-slate-200 font-semibold">
                    {selectedAsset.is_shared === 1 ? 'Shared Bookable' : 'Dedicated / Assigned'}
                  </span>
                </div>
              </div>

              {/* Dynamic Categories Custom Specs */}
              {selectedAsset.custom_fields && Object.keys(selectedAsset.custom_fields).length > 0 && (
                <div className="space-y-2 border-b border-slate-900 pb-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Specifications Attributes</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {Object.entries(selectedAsset.custom_fields).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-slate-400 capitalize block text-[10px] font-bold">{key.replace(/_/g, ' ')}</span>
                        <span className="text-slate-200 font-semibold">{val || <span className="text-slate-600">Not set</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allocation Details (if allocated) */}
              {selectedAsset.status === 'Allocated' && (
                <div className="p-4 bg-blue-950/10 border border-blue-500/10 rounded-xl text-xs space-y-2">
                  <h3 className="font-bold text-blue-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Current Allocation
                  </h3>
                  <p className="text-slate-300">
                    Currently held by: <strong>{selectedAsset.current_holder_name || selectedAsset.current_dept_name}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="btn-secondary py-2 text-xs px-6"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: ASSET CHRONOLOGICAL HISTORY / LOGS */}
      {historyOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <div className="glass-card w-full max-w-xl rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{selectedAsset.asset_tag}</span>
                <h2 className="text-base font-bold text-slate-100 mt-1">Audit Logs & History</h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {assetHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No activity history logged for this asset yet.
                </div>
              ) : (
                <div className="relative border-l border-slate-900 pl-6 space-y-6 max-h-96 overflow-y-auto">
                  {assetHistory.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-9.5 top-1 w-3 h-3 rounded-full bg-purple-600 ring-4 ring-slate-950" />
                      
                      <div className="flex justify-between items-center text-slate-500">
                        <span className="font-bold text-purple-400 capitalize">{log.action_type}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      
                      <p className="font-semibold text-slate-200 mt-1.5">{log.details}</p>
                      
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span>Performed by:</span>
                        <strong className="text-slate-400">{log.user_name || 'System'}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-900">
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="btn-secondary py-2 text-xs px-6"
                >
                  Close Logs
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Assets;

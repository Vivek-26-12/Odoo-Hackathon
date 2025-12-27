# 🚀 GEARGUARD - DEMO GUIDE

## Quick Start

### 1. **Start the Application**

```bash
# Terminal 1 - Backend
cd server
nodemon index.js

# Terminal 2 - Frontend
cd ..
npm run dev
```

### 2. **Access the Application**
Open browser: `http://localhost:5173`

---

## 🎭 DEMO SCENARIOS

### **Scenario 1: Technician Daily Workflow**

**Login as**: `john@example.com` / `pass123` (Technician)

1. **View Dashboard**
   - See "My Work Dashboard"
   - Check "Assigned to Me" count
   - View "Today's Jobs"

2. **Work on Request**
   - Go to "Maintenance" page
   - Click on a request card in "NEW" column
   - Click "Start Work" → Moves to "IN PROGRESS"
   - Enter duration (e.g., 2.5 hours)
   - Click "Mark as Repaired"
   - ✅ Request moves to "REPAIRED" column

3. **Check Calendar**
   - Go to "Calendar" page
   - See scheduled preventive maintenance

---

### **Scenario 2: Manager Planning**

**Login as**: `jane@example.com` / `pass123` (Manager)

1. **View Dashboard**
   - See "Manager Dashboard"
   - Check "Upcoming Preventive Maintenance (Next 7 Days)"
   - View "Unassigned Requests"

2. **Schedule Preventive Maintenance**
   - Go to "Calendar" page
   - Click "Schedule Maintenance" button
   - Select equipment
   - Set type to "Preventive"
   - Choose scheduled date
   - ✅ Request appears on calendar

3. **Assign Technician**
   - Go to "Maintenance" page
   - Click unassigned request card
   - Select technician from dropdown
   - Click "Assign"
   - ✅ Technician now assigned

---

### **Scenario 3: Equipment Breakdown (Corrective)**

**Login as**: Any employee

1. **Report Breakdown**
   - Go to "Equipment" page
   - Find broken equipment (e.g., "Hydraulic Press")
   - Click "Maintenance" smart button
   - See filtered requests for that equipment

2. **Create New Request**
   - Click "New Request" button
   - Select equipment → Team auto-fills
   - Enter subject: "Oil Leak"
   - Set priority: "High"
   - ✅ Request created in "NEW" column

3. **Track Progress**
   - Watch as technician moves it through stages
   - NEW → IN PROGRESS → REPAIRED

---

### **Scenario 4: Equipment Scrapping**

**Login as**: Technician or Manager

1. **Identify Unrepairable Equipment**
   - Go to "Maintenance" page
   - Click on a request in "IN PROGRESS"

2. **Scrap Decision**
   - Click "Scrap Equipment" button
   - ✅ Request moves to "SCRAP" column
   - ✅ Equipment status changes to "Scrapped"

3. **Verify**
   - Go to "Equipment" page
   - See equipment marked as "Scrapped"

---

## 🎯 KEY FEATURES TO SHOWCASE

### **1. Smart Auto-Fill**
- Create request → Select equipment → Team auto-populates
- **Why**: Equipment category determines maintenance team

### **2. Drag & Drop**
- Drag request cards between columns
- **Why**: Quick status updates

### **3. Smart Buttons**
- Equipment card → "Maintenance (2)" button
- **Why**: See all requests for specific equipment

### **4. Role-Based Dashboards**
- Different users see different dashboards
- **Why**: Personalized experience

### **5. Overdue Indicators**
- Red border on late requests
- **Why**: Visual priority management

### **6. Calendar Integration**
- Preventive requests appear on scheduled dates
- **Why**: Planning visibility

---

## 🎬 JUDGE PRESENTATION SCRIPT

### **Opening (30 seconds)**
> "GearGuard is an intelligent maintenance management system that brings ERP-level automation to equipment maintenance. Unlike basic CRUD apps, GearGuard understands workflows."

### **Demo Flow (2 minutes)**

1. **Show Dashboard** (15s)
   - "Each role sees personalized metrics"
   - Show Technician dashboard

2. **Create Request** (30s)
   - "Watch the auto-fill magic"
   - Select equipment → Team auto-populates
   - "This is relational intelligence, not hardcoding"

3. **Kanban Workflow** (30s)
   - Click card → Show detail modal
   - Assign technician
   - Drag to "In Progress"
   - "All changes persist to database"

4. **Smart Button** (15s)
   - Equipment page → Click "Maintenance (2)"
   - "Filtered view of requests for this equipment"

5. **Calendar** (15s)
   - "Preventive maintenance scheduling"
   - Click date → Create scheduled job

### **Closing (15 seconds)**
> "GearGuard demonstrates: role-based UX, smart automation, and ERP-style workflows. Built in 3 hours, production-ready architecture."

---

## 💡 TALKING POINTS

### **Technical Highlights**
- ✅ React + Vite (modern stack)
- ✅ MySQL with proper schema
- ✅ RESTful API
- ✅ Role-based routing
- ✅ Relational data intelligence
- ✅ Real-time UI updates

### **Business Value**
- ✅ Reduces equipment downtime
- ✅ Automates team assignment
- ✅ Prevents missed maintenance
- ✅ Tracks work hours
- ✅ Equipment lifecycle management

### **UX Excellence**
- ✅ Odoo-inspired design
- ✅ Drag-drop interactions
- ✅ Smart buttons
- ✅ Empty states
- ✅ Visual indicators (overdue, priority)

---

## 🐛 KNOWN LIMITATIONS (Be Honest)

1. **No Real Auth**: Simulated via routes (post-hackathon: add JWT)
2. **No File Uploads**: Attachments table exists but not wired
3. **No Notifications**: Email/push notifications not implemented
4. **No Mobile Optimization**: Desktop-first design

**But**: All core workflows are 100% functional!

---

## 📸 SCREENSHOT CHECKLIST

Before demo, capture:
- [ ] Admin Dashboard
- [ ] Technician Dashboard
- [ ] Kanban Board (all columns)
- [ ] Request Detail Modal
- [ ] New Request Modal
- [ ] Equipment Page with Smart Button
- [ ] Calendar View

---

## ⚡ QUICK FIXES (If Needed)

### If login doesn't work:
```javascript
// In browser console:
localStorage.setItem('user', JSON.stringify({
  id: 1,
  name: 'John Doe',
  role: 'Technician',
  email: 'john@example.com'
}));
// Then refresh page
```

### If data is missing:
```bash
cd server
node seed.js
```

---

## 🏆 WIN CONDITIONS

You've built a system that:
1. ✅ Solves a real problem (maintenance tracking)
2. ✅ Shows technical depth (relational logic, not CRUD)
3. ✅ Has professional UX (Odoo-inspired)
4. ✅ Is demo-ready (working flows)
5. ✅ Is scalable (proper architecture)

**You're ready to win! 🚀**

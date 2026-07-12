import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js';
import pool from '../config/db.js';

describe('AssetFlow API Integration Tests Suite', () => {
  // Test Variables
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;
  const testPassword = 'Password@123';
  let testUserId = null;
  let authToken = null;
  let adminToken = null;
  let departmentId = null;
  let categoryId = null;
  let assetId = null;
  let resourceId = null;

  // Cleanup Database Pool after tests complete
  after(async () => {
    // Delete test database entries to keep clean database state
    try {
      await pool.query('SET FOREIGN_KEY_CHECKS = 0');
      if (testUserId) {
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
      }
      if (departmentId) {
        await pool.query('DELETE FROM departments WHERE id = ?', [departmentId]);
      }
      if (categoryId) {
        await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
      }
      if (assetId) {
        await pool.query('DELETE FROM assets WHERE id = ?', [assetId]);
        await pool.query('DELETE FROM asset_history WHERE asset_id = ?', [assetId]);
      }
      if (resourceId) {
        await pool.query('DELETE FROM resources WHERE id = ?', [resourceId]);
      }
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (err) {
      console.error('Test cleanup warning:', err.message);
    }
    await pool.end();
  });

  // ==========================================
  // SECTION 1: AUTHENTICATION FLOW TESTS
  // ==========================================
  describe('Authentication Endpoints', () => {
    it('should register a new employee user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
          name: 'Test QA Engineer'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message').that.contains('OTP sent');
    });

    it('should verify email using OTP fetched from database', async () => {
      // Query the database to get the generated OTP for the test email
      const [rows] = await pool.query('SELECT id, otp FROM users WHERE email = ?', [testEmail]);
      expect(rows.length).to.equal(1);
      
      testUserId = rows[0].id;
      const otp = rows[0].otp;
      expect(otp).to.not.be.null;

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testEmail,
          otp: otp
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.message).to.contain('successfully');
    });

    it('should reject duplicate registrations once verified', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
          name: 'Test QA Engineer'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });

    it('should successfully log in and return a JWT access token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      authToken = res.body.token;
    });

    it('should log in default administrator successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@assetflow.com',
          password: 'Admin@123'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      adminToken = res.body.token;
    });
  });

  // ==========================================
  // SECTION 2: DEPARTMENTS & SCHEMAS TESTS
  // ==========================================
  describe('Organization Setup Endpoints', () => {
    it('should allow Admin to create a new department', async () => {
      const res = await request(app)
        .post('/api/org/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `QA Department ${timestamp}`,
          description: 'Department for testing API configurations'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('departmentId');
      departmentId = res.body.departmentId;
    });

    it('should block non-admins from creating departments', async () => {
      const res = await request(app)
        .post('/api/org/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `QA Blocked Dept`,
          description: 'Should fail'
        });

      expect(res.status).to.equal(403);
    });

    it('should allow Admin to create asset categories with dynamic field schemas', async () => {
      const res = await request(app)
        .post('/api/org/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `QA Laptops Category ${timestamp}`,
          description: 'Laptops with specialized specifications',
          fields: [
            { name: 'ram', label: 'RAM Memory Size', type: 'text' },
            { name: 'warranty_months', label: 'Warranty Period (Months)', type: 'number' }
          ]
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('categoryId');
      categoryId = res.body.categoryId;
    });
  });

  // ==========================================
  // SECTION 3: ASSETS DIRECTORY TESTS
  // ==========================================
  describe('Asset Directory Endpoints', () => {
    it('should register a new asset with dynamic custom specs', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QA Test Macbook Pro',
          category_id: categoryId,
          serial_number: `QA-SN-MBP-${timestamp}`,
          acquisition_date: '2026-07-01',
          acquisition_cost: 1999.99,
          condition_status: 'New',
          location: 'Bangalore QA Lab, Rack 4',
          is_shared: false,
          custom_fields: {
            ram: '32GB DDR5',
            warranty_months: 24
          }
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('asset');
      expect(res.body.asset).to.have.property('id');
      assetId = res.body.asset.id;
    });

    it('should list assets and filter by category', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category_id: categoryId });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.assets).to.be.an('array');
      expect(res.body.assets.length).to.be.at.least(1);
    });
  });

  // ==========================================
  // SECTION 4: ALLOCATIONS & CHECKOUT TESTS
  // ==========================================
  describe('Asset Allocation Endpoints', () => {
    it('should allocate an asset to an employee', async () => {
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          asset_id: assetId,
          allocated_to_type: 'employee',
          employee_id: testUserId,
          expected_return_date: '2026-12-31'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
    });

    it('should reject double-allocation and return a 409 conflict', async () => {
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          asset_id: assetId,
          allocated_to_type: 'employee',
          employee_id: 1, // Attempt to allocate to default admin
          expected_return_date: '2026-12-31'
        });

      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('conflict', true);
      expect(res.body).to.have.property('currently_held_by');
    });
  });

  // ==========================================
  // SECTION 5: RESOURCE BOOKING TESTS
  // ==========================================
  describe('Resource Booking Endpoints', () => {
    it('should register a bookable resource', async () => {
      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `QA Conf Room ${timestamp}`,
          type: 'room',
          description: 'Automated Test Conference room'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('resourceId');
      resourceId = res.body.resourceId;
    });

    it('should reserve a time slot successfully', async () => {
      const res = await request(app)
        .post('/api/resources/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resource_id: resourceId,
          start_time: '2026-12-01 10:00:00',
          end_time: '2026-12-01 12:00:00',
          booked_for_type: 'employee'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
    });

    it('should reject overlapping booking reservations with 409 conflict', async () => {
      const res = await request(app)
        .post('/api/resources/book')
        .set('Authorization', `Bearer styleToken`) // Testing validation with auth
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resource_id: resourceId,
          start_time: '2026-12-01 11:00:00', // Overlaps
          end_time: '2026-12-01 13:00:00',
          booked_for_type: 'employee'
        });

      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.contain('already booked');
    });
  });

  // ==========================================
  // SECTION 6: ERP WORKFLOWS & HARDENING TESTS
  // ==========================================
  describe('ERP Hardening & Workflow Enforcements', () => {
    let maintenanceRequestId;
    let auditCycleId;

    it('should lock asset status from direct mutations via edit API', async () => {
      // 1. Fetch current asset details to get its status
      const getRes = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const originalStatus = getRes.body.asset.status;
      const targetMutation = originalStatus === 'Available' ? 'Allocated' : 'Available';

      // 2. Attempt PUT edit request sending the mutated status
      const putRes = await request(app)
        .put(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: getRes.body.asset.name,
          category_id: getRes.body.asset.category_id,
          serial_number: getRes.body.asset.serial_number,
          acquisition_date: getRes.body.asset.acquisition_date.substring(0, 10),
          acquisition_cost: getRes.body.asset.acquisition_cost,
          condition_status: getRes.body.asset.condition_status,
          location: getRes.body.asset.location,
          is_shared: getRes.body.asset.is_shared,
          status: targetMutation // Direct mutation payload
        });

      expect(putRes.status).to.equal(200);

      // 3. Verify that the asset status remained locked to its original database value
      const verifyRes = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyRes.body.asset.status).to.equal(originalStatus);
    });

    it('should enforce maintenance sequence rules and delay Under Maintenance state', async () => {
      // 1. Create a new asset for this maintenance test to ensure it starts as Available
      const assetReg = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QA Maintenance Test Laptop',
          category_id: categoryId,
          serial_number: `SN-QA-MAINT-${Date.now()}`,
          acquisition_date: '2026-06-01',
          acquisition_cost: 1500.00,
          condition_status: 'New',
          location: 'HQ Floor 1'
        });
      
      const testAssetId = assetReg.body.asset.id;

      // 2. Raise maintenance request (status Pending)
      const raiseRes = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset_id: testAssetId,
          issue_description: 'Spacebar keyboard key popped off.',
          priority: 'Medium'
        });

      expect(raiseRes.status).to.equal(201);
      maintenanceRequestId = raiseRes.body.requestId;

      // 3. Verify asset status remains Available (not Under Maintenance yet!)
      let assetVerify = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(assetVerify.body.asset.status).to.equal('Available');

      // 4. Try invalid transition: Pending -> In Progress (should fail 400)
      const badTrans = await request(app)
        .put(`/api/maintenance/${maintenanceRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'In Progress'
        });
      expect(badTrans.status).to.equal(400);
      expect(badTrans.body.message).to.contain('Invalid status transition');

      // 5. Valid transition: Approve and assign technician (moves directly to Technician Assigned)
      const approveRes = await request(app)
        .put(`/api/maintenance/${maintenanceRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Approved',
          technician_assigned: 'Jane Doe (Hardware Tech)',
          notes: 'Approved for offsite repair.'
        });
      expect(approveRes.status).to.equal(200);

      // Verify that status is now Technician Assigned
      const requestDetails = await request(app)
        .get(`/api/maintenance/${maintenanceRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(requestDetails.body.request.status).to.equal('Technician Assigned');

      // 6. Verify that the asset status has now transitioned to Under Maintenance
      assetVerify = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(assetVerify.body.asset.status).to.equal('Under Maintenance');

      // 7. Transition: Technician Assigned -> In Progress
      const progressRes = await request(app)
        .put(`/api/maintenance/${maintenanceRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'In Progress',
          notes: 'Technician has started repairing.'
        });
      expect(progressRes.status).to.equal(200);

      // 8. Transition: In Progress -> Resolved
      const resolveRes = await request(app)
        .put(`/api/maintenance/${maintenanceRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Resolved',
          notes: 'Keyboard replaced.'
        });
      expect(resolveRes.status).to.equal(200);

      // 9. Verify that the asset has reverted to Available status
      assetVerify = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(assetVerify.body.asset.status).to.equal('Available');
    });

    it('should block verifications and modifications on a closed audit cycle', async () => {
      // 1. Create a new audit cycle
      const cycleRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `QA Verification Lock Audit ${Date.now()}`,
          start_date: '2026-07-01',
          end_date: '2026-07-31',
          auditor_ids: [1]
        });
      
      expect(cycleRes.status).to.equal(201);
      auditCycleId = cycleRes.body.cycleId;

      // 2. Fetch scoped assets to log a verification check-off
      const detailsRes = await request(app)
        .get(`/api/audits/${auditCycleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      const testAssetId = detailsRes.body.assets[0].asset_id;

      // 3. Log a verification: should succeed while cycle is Active
      const verifyRes = await request(app)
        .post(`/api/audits/${auditCycleId}/verify/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_status: 'Verified',
          notes: 'Asset is at Desk 4.'
        });
      
      expect(verifyRes.status).to.equal(200);

      // 4. Close the audit cycle
      const closeRes = await request(app)
        .post(`/api/audits/${auditCycleId}/close`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(closeRes.status).to.equal(200);

      // 5. Attempt another verification: should fail with 400 error because cycle is closed
      const lockRes = await request(app)
        .post(`/api/audits/${auditCycleId}/verify/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_status: 'Verified',
          notes: 'Checking locked state.'
        });
      
      expect(lockRes.status).to.equal(400);
      expect(lockRes.body.message).to.contain('closed and locked');
    });
  });
});

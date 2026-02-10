/**
 * API Integration Tests
 * Comprehensive test suite for all API endpoints
 */

import { db } from '../server/utils/db.js';

// Test configuration
const BASE_URL = 'http://localhost:3001';
let authToken = '';
let testFirmId = null;
let testUserId = null;

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test helper functions
 */
async function apiCall(method, endpoint, data = null, token = authToken) {
  results.total++;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (response.ok) {
      results.passed++;
      console.log(`✅ ${method} ${endpoint} - PASSED`);
      return { success: true, data: result };
    } else {
      results.failed++;
      results.errors.push(`${method} ${endpoint}: ${result.error || 'Unknown error'}`);
      console.log(`❌ ${method} ${endpoint} - FAILED: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`${method} ${endpoint}: ${error.message}`);
    console.log(`❌ ${method} ${endpoint} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Suite 1: Authentication
 */
async function testAuthentication() {
  console.log('\n=== Testing Authentication ===');
  
  // Test login
  const loginResult = await apiCall('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, null);

  if (loginResult.success) {
    authToken = loginResult.data.token;
    testUserId = loginResult.data.user.id;
    testFirmId = loginResult.data.user.firm_id;
  }
}

/**
 * Test Suite 2: Parties Module
 */
async function testParties() {
  console.log('\n=== Testing Parties Module ===');
  
  // Create party
  const createResult = await apiCall('POST', '/api/parties', {
    party_name: 'Test Customer Ltd',
    party_type: 'CUSTOMER',
    contact_person: 'John Doe',
    phone: '9876543210',
    email: 'test@example.com',
    address: 'Test Address',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstin: '27AABCU9603R1ZM'
  });

  const partyId = createResult.data?.partyId;

  // Get all parties
  await apiCall('GET', '/api/parties');

  // Get party by ID
  if (partyId) {
    await apiCall('GET', `/api/parties/${partyId}`);
    
    // Update party
    await apiCall('PUT', `/api/parties/${partyId}`, {
      phone: '9876543211'
    });
  }
}

/**
 * Test Suite 3: Stocks Module
 */
async function testStocks() {
  console.log('\n=== Testing Stocks Module ===');
  
  // Create stock
  const createResult = await apiCall('POST', '/api/stocks', {
    item_name: 'Test Product',
    hsn_code: '1234',
    unit: 'PCS',
    rate: 100,
    gst_rate: 18,
    current_stock: 100,
    reorder_level: 10
  });

  const stockId = createResult.data?.stockId;

  // Get all stocks
  await apiCall('GET', '/api/stocks');

  // Get stock by ID
  if (stockId) {
    await apiCall('GET', `/api/stocks/${stockId}`);
    
    // Update stock
    await apiCall('PUT', `/api/stocks/${stockId}`, {
      rate: 110
    });
  }
}

/**
 * Test Suite 4: Sales Module
 */
async function testSales() {
  console.log('\n=== Testing Sales Module ===');
  
  // Create sales bill
  const createResult = await apiCall('POST', '/api/sales', {
    bill_date: '2024-02-10',
    party_id: 1,
    party_name: 'Test Customer',
    party_gstin: '27AABCU9603R1ZM',
    items: [
      {
        stock_id: 1,
        item_name: 'Test Product',
        qty: 10,
        rate: 100,
        gst_rate: 18
      }
    ]
  });

  const billId = createResult.data?.billId;

  // Get all sales bills
  await apiCall('GET', '/api/sales');

  // Get sales bill by ID
  if (billId) {
    await apiCall('GET', `/api/sales/${billId}`);
  }
}

/**
 * Test Suite 5: Purchase Module
 */
async function testPurchase() {
  console.log('\n=== Testing Purchase Module ===');
  
  // Create purchase bill
  const createResult = await apiCall('POST', '/api/purchase', {
    bill_date: '2024-02-10',
    party_id: 1,
    party_name: 'Test Supplier',
    party_gstin: '27AABCU9603R1ZM',
    items: [
      {
        stock_id: 1,
        item_name: 'Test Product',
        qty: 20,
        rate: 80,
        gst_rate: 18
      }
    ]
  });

  const billId = createResult.data?.billId;

  // Get all purchase bills
  await apiCall('GET', '/api/purchase');

  // Get purchase bill by ID
  if (billId) {
    await apiCall('GET', `/api/purchase/${billId}`);
  }
}

/**
 * Test Suite 6: Ledger Module
 */
async function testLedger() {
  console.log('\n=== Testing Ledger Module ===');
  
  // Get all accounts
  await apiCall('GET', '/api/ledger/accounts');

  // Get trial balance
  await apiCall('GET', '/api/ledger/trial-balance');

  // Get P&L
  await apiCall('GET', '/api/ledger/reports/profit-loss');

  // Get balance sheet
  await apiCall('GET', '/api/ledger/reports/balance-sheet');
}

/**
 * Test Suite 7: Vouchers Module
 */
async function testVouchers() {
  console.log('\n=== Testing Vouchers Module ===');
  
  // Create payment voucher
  const createResult = await apiCall('POST', '/api/vouchers/payment', {
    voucher_date: '2024-02-10',
    paid_from_account: 'HDFC Bank',
    paid_from_type: 'BANK',
    paid_to_account: 'Rent Expense',
    paid_to_type: 'EXPENSES',
    amount: 50000,
    narration: 'Office rent'
  });

  // Get all vouchers
  await apiCall('GET', '/api/vouchers');

  // Get vouchers summary
  await apiCall('GET', '/api/vouchers/reports/summary');
}

/**
 * Test Suite 8: Banking Module
 */
async function testBanking() {
  console.log('\n=== Testing Banking Module ===');
  
  // Create bank account
  const createResult = await apiCall('POST', '/api/banking/accounts', {
    account_name: 'HDFC Bank - Current',
    account_number: '50200012345678',
    bank_name: 'HDFC Bank',
    branch: 'MG Road',
    ifsc_code: 'HDFC0001234',
    account_type: 'CURRENT',
    opening_balance: 500000
  });

  const accountId = createResult.data?.accountId;

  // Get all bank accounts
  await apiCall('GET', '/api/banking/accounts');

  // Get account balance
  if (accountId) {
    await apiCall('GET', `/api/banking/accounts/${accountId}/balance`);
  }
}

/**
 * Test Suite 9: Reports Module
 */
async function testReports() {
  console.log('\n=== Testing Reports Module ===');
  
  // Sales reports
  await apiCall('GET', '/api/reports/sales/summary');
  await apiCall('GET', '/api/reports/sales/by-party');
  await apiCall('GET', '/api/reports/sales/by-item');

  // Purchase reports
  await apiCall('GET', '/api/reports/purchase/summary');
  await apiCall('GET', '/api/reports/purchase/by-party');

  // Stock reports
  await apiCall('GET', '/api/reports/stock/summary');
  await apiCall('GET', '/api/reports/stock/valuation');

  // GST reports
  await apiCall('GET', '/api/reports/gst/summary');

  // Financial reports
  await apiCall('GET', '/api/reports/financial/profit-loss');
  await apiCall('GET', '/api/reports/financial/balance-sheet');

  // Dashboard
  await apiCall('GET', '/api/reports/dashboard/overview');
}

/**
 * Test Suite 10: Notes Module
 */
async function testNotes() {
  console.log('\n=== Testing Notes Module ===');
  
  // Create credit note
  await apiCall('POST', '/api/notes/credit', {
    bill_date: '2024-02-10',
    party_id: 1,
    party_name: 'Test Customer',
    original_bill_no: 'INV-001',
    items: [
      {
        item_name: 'Test Product',
        qty: 2,
        rate: 100,
        gst_rate: 18
      }
    ],
    reason: 'Damaged goods'
  });

  // Get all credit notes
  await apiCall('GET', '/api/notes/credit');

  // Create delivery note
  await apiCall('POST', '/api/notes/delivery', {
    bill_date: '2024-02-10',
    party_id: 1,
    party_name: 'Test Customer',
    items: [
      {
        stock_id: 1,
        item_name: 'Test Product',
        qty: 5,
        rate: 100
      }
    ]
  });

  // Get all delivery notes
  await apiCall('GET', '/api/notes/delivery');
}

/**
 * Test Suite 11: Settings Module
 */
async function testSettings() {
  console.log('\n=== Testing Settings Module ===');
  
  // Get firm settings
  await apiCall('GET', '/api/settings/firm');

  // Get invoice settings
  await apiCall('GET', '/api/settings/invoice');

  // Get number format settings
  await apiCall('GET', '/api/settings/number-format');

  // Get tax settings
  await apiCall('GET', '/api/settings/tax');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting API Integration Tests...\n');
  console.log('Base URL:', BASE_URL);
  console.log('='.repeat(50));

  try {
    await testAuthentication();
    await testParties();
    await testStocks();
    await testSales();
    await testPurchase();
    await testLedger();
    await testVouchers();
    await testBanking();
    await testReports();
    await testNotes();
    await testSettings();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n✨ Testing completed!');

  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };

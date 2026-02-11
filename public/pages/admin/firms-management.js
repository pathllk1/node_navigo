/**
 * FIRMS MANAGEMENT
 * Handles firm CRUD operations and management
 */

export function initFirmsManagement() {
    const firmModal = document.getElementById('firm-modal');
    const closeFirmModalBtn = document.getElementById('close-firm-modal');
    const cancelFirmBtn = document.getElementById('cancel-firm-btn');
    const addFirmBtn = document.getElementById('add-firm-btn');
    const firmForm = document.getElementById('firm-form');
    const gstFetchBtn = document.getElementById('btn-fetch-firm-gst');

    // GST Fetch button handler
    if (gstFetchBtn) {
        gstFetchBtn.addEventListener('click', function() {
            fetchFirmByGST(this);
        });
    }

    // Modal handlers
    if (closeFirmModalBtn) {
        closeFirmModalBtn.addEventListener('click', () => {
            firmModal.classList.add('hidden');
        });
    }

    if (cancelFirmBtn) {
        cancelFirmBtn.addEventListener('click', () => {
            firmModal.classList.add('hidden');
        });
    }

    if (addFirmBtn) {
        addFirmBtn.addEventListener('click', () => {
            openFirmModal();
        });
    }

    if (firmForm) {
        firmForm.addEventListener('submit', handleFirmSubmit);
    }

    firmModal.addEventListener('click', (e) => {
        if (e.target === firmModal) {
            firmModal.classList.add('hidden');
        }
    });

    // Load firms management (detailed view)
    window.loadFirmsManagement = async function() {
        const container = document.getElementById('firms-management-list');
        if (!container) return;
        
        container.innerHTML = '<p class="text-gray-500">Loading...</p>';

        try {
            const res = await fetch('/admin/firm-management/firms');
            const data = await res.json();

            if (data.firms && data.firms.length > 0) {
                const table = `
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Legal Name</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${data.firms.map(firm => `
                                <tr>
                                    <td class="px-4 py-3 text-sm text-gray-700">${firm.id}</td>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${firm.name}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700">${firm.legal_name || '-'}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700">${firm.city || '-'}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700">${firm.gst_number || '-'}</td>
                                    <td class="px-4 py-3 text-sm">
                                        <button class="text-blue-600 hover:text-blue-800 mr-2 edit-firm-btn" data-id="${firm.id}">Edit</button>
                                        <button class="text-red-600 hover:text-red-800 delete-firm-btn" data-id="${firm.id}">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
                container.innerHTML = table;

                // Add event listeners
                document.querySelectorAll('.edit-firm-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const firmId = btn.getAttribute('data-id');
                        editFirm(firmId);
                    });
                });

                document.querySelectorAll('.delete-firm-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const firmId = btn.getAttribute('data-id');
                        deleteFirm(firmId);
                    });
                });
            } else {
                container.innerHTML = '<p class="text-gray-500">No firms found</p>';
            }
        } catch (err) {
            console.error('Error loading firms management:', err);
            container.innerHTML = '<p class="text-red-500">Failed to load firms</p>';
        }
    };

    // Load user assignment
    window.loadUserAssignment = async function() {
        const container = document.getElementById('user-assignment-list');
        if (!container) return;
        
        container.innerHTML = '<p class="text-gray-500">Loading...</p>';

        try {
            const res = await fetch('/admin/firm-management/users-with-firms');
            const firmsRes = await fetch('/admin/firm-management/firms');

            if (!res.ok || !firmsRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const userData = await res.json();
            const firmsData = await firmsRes.json();

            if (userData.users && userData.users.length > 0) {
                const table = `
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Firm</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assign To Firm</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${userData.users.map(user => `
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${user.fullname}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700">${user.email}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700">${user.firm_name || 'No Firm'}</td>
                                    <td class="px-4 py-3 text-sm">
                                        <select class="assign-firm-select px-2 py-1 border border-gray-300 rounded text-sm" data-user-id="${user.id}">
                                            <option value="">Select Firm</option>
                                            ${firmsData.firms.map(firm => `
                                                <option value="${firm.id}" ${user.firm_id == firm.id ? 'selected' : ''}>
                                                    ${firm.name}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </td>
                                    <td class="px-4 py-3 text-sm">
                                        <button class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 assign-user-btn" data-user-id="${user.id}">Assign</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
                container.innerHTML = table;

                // Add event listeners
                document.querySelectorAll('.assign-user-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const userId = btn.getAttribute('data-user-id');
                        const selectElement = document.querySelector(`select[data-user-id="${userId}"]`);
                        const firmId = selectElement ? selectElement.value : null;
                        assignUserToFirm(userId, firmId);
                    });
                });
            } else {
                container.innerHTML = '<p class="text-gray-500">No users found</p>';
            }
        } catch (err) {
            console.error('Error loading user assignment:', err);
            container.innerHTML = '<p class="text-red-500">Failed to load users</p>';
        }
    };

    // Firm modal functions
    function openFirmModal(firm = null) {
        const firmIdInput = document.getElementById('firm-id');
        const modalTitle = document.getElementById('modal-title');
        const adminAccountSection = document.getElementById('admin-account-section');

        if (firm) {
            // Editing existing firm - hide admin account section
            modalTitle.textContent = 'Edit Firm';
            firmIdInput.value = firm.id;
            adminAccountSection.classList.add('hidden');
            
            // Clear admin fields
            document.getElementById('admin-fullname').value = '';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
            
            // Basic Information
            document.getElementById('firm-name').value = firm.name || '';
            document.getElementById('firm-legal-name').value = firm.legal_name || '';
            document.getElementById('firm-address').value = firm.address || '';
            document.getElementById('firm-city').value = firm.city || '';
            document.getElementById('firm-state').value = firm.state || '';
            document.getElementById('firm-country').value = firm.country || '';
            document.getElementById('firm-pincode').value = firm.pincode || '';
            document.getElementById('firm-phone').value = firm.phone_number || '';
            document.getElementById('firm-secondary-phone').value = firm.secondary_phone || '';
            document.getElementById('firm-email').value = firm.email || '';
            document.getElementById('firm-website').value = firm.website || '';
            document.getElementById('firm-business-type').value = firm.business_type || '';
            document.getElementById('firm-industry-type').value = firm.industry_type || '';
            document.getElementById('firm-establishment-year').value = firm.establishment_year || '';
            document.getElementById('firm-employee-count').value = firm.employee_count || '';
            
            // Registration Details
            document.getElementById('firm-registration-number').value = firm.registration_number || '';
            document.getElementById('firm-registration-date').value = firm.registration_date || '';
            document.getElementById('firm-cin-number').value = firm.cin_number || '';
            document.getElementById('firm-pan-number').value = firm.pan_number || '';
            document.getElementById('firm-gst-number').value = firm.gst_number || '';
            document.getElementById('firm-tax-id').value = firm.tax_id || '';
            document.getElementById('firm-vat-number').value = firm.vat_number || '';
            
            // Banking Details
            document.getElementById('firm-bank-account-number').value = firm.bank_account_number || '';
            document.getElementById('firm-bank-name').value = firm.bank_name || '';
            document.getElementById('firm-bank-branch').value = firm.bank_branch || '';
            document.getElementById('firm-ifsc-code').value = firm.ifsc_code || '';
            document.getElementById('firm-payment-terms').value = firm.payment_terms || '';
            
            // Compliance
            document.getElementById('firm-status').value = firm.status || 'ACTIVE';
            document.getElementById('firm-license-numbers').value = firm.license_numbers || '';
            document.getElementById('firm-insurance-details').value = firm.insurance_details || '';
            
            // Business Settings
            document.getElementById('firm-currency').value = firm.currency || 'INR';
            document.getElementById('firm-timezone').value = firm.timezone || 'Asia/Kolkata';
            document.getElementById('firm-fiscal-year-start').value = firm.fiscal_year_start || 4;
            document.getElementById('firm-invoice-prefix').value = firm.invoice_prefix || 'INV';
            document.getElementById('firm-quote-prefix').value = firm.quote_prefix || 'QT';
            document.getElementById('firm-po-prefix').value = firm.po_prefix || 'PO';
            
            // Document Settings
            document.getElementById('firm-logo-url').value = firm.logo_url || '';
            document.getElementById('firm-invoice-template').value = firm.invoice_template || 'standard';
            document.getElementById('firm-enable-e-invoice').checked = firm.enable_e_invoice === 1;
        } else {
            // Creating new firm - show admin account section
            modalTitle.textContent = 'Add New Firm';
            firmIdInput.value = '';
            firmForm.reset();
            adminAccountSection.classList.remove('hidden');
            
            // Set defaults
            document.getElementById('firm-country').value = 'India';
            document.getElementById('firm-status').value = 'ACTIVE';
            document.getElementById('firm-currency').value = 'INR';
            document.getElementById('firm-timezone').value = 'Asia/Kolkata';
            document.getElementById('firm-fiscal-year-start').value = 4;
            document.getElementById('firm-invoice-prefix').value = 'INV';
            document.getElementById('firm-quote-prefix').value = 'QT';
            document.getElementById('firm-po-prefix').value = 'PO';
            document.getElementById('firm-invoice-template').value = 'standard';
        }

        firmModal.classList.remove('hidden');
    }

    async function handleFirmSubmit(e) {
        e.preventDefault();

        const firmId = document.getElementById('firm-id').value;
        
        // Basic Information
        const name = document.getElementById('firm-name').value.trim();
        const legalName = document.getElementById('firm-legal-name').value.trim();
        const address = document.getElementById('firm-address').value.trim();
        const city = document.getElementById('firm-city').value.trim();
        const state = document.getElementById('firm-state').value.trim();
        const country = document.getElementById('firm-country').value.trim();
        const pincode = document.getElementById('firm-pincode').value.trim();
        const phoneNumber = document.getElementById('firm-phone').value.trim();
        const secondaryPhone = document.getElementById('firm-secondary-phone').value.trim();
        const email = document.getElementById('firm-email').value.trim();
        const website = document.getElementById('firm-website').value.trim();
        const businessType = document.getElementById('firm-business-type').value.trim();
        const industryType = document.getElementById('firm-industry-type').value.trim();
        const establishmentYear = document.getElementById('firm-establishment-year').value.trim();
        const employeeCount = document.getElementById('firm-employee-count').value.trim();
        
        // Registration Details
        const registrationNumber = document.getElementById('firm-registration-number').value.trim();
        const registrationDate = document.getElementById('firm-registration-date').value.trim();
        const cinNumber = document.getElementById('firm-cin-number').value.trim();
        const panNumber = document.getElementById('firm-pan-number').value.trim();
        const gstNumber = document.getElementById('firm-gst-number').value.trim();
        const taxId = document.getElementById('firm-tax-id').value.trim();
        const vatNumber = document.getElementById('firm-vat-number').value.trim();
        
        // Banking Details
        const bankAccountNumber = document.getElementById('firm-bank-account-number').value.trim();
        const bankName = document.getElementById('firm-bank-name').value.trim();
        const bankBranch = document.getElementById('firm-bank-branch').value.trim();
        const ifscCode = document.getElementById('firm-ifsc-code').value.trim();
        const paymentTerms = document.getElementById('firm-payment-terms').value.trim();
        
        // Compliance
        const status = document.getElementById('firm-status').value;
        const licenseNumbers = document.getElementById('firm-license-numbers').value.trim();
        const insuranceDetails = document.getElementById('firm-insurance-details').value.trim();
        
        // Business Settings
        const currency = document.getElementById('firm-currency').value;
        const timezone = document.getElementById('firm-timezone').value;
        const fiscalYearStart = document.getElementById('firm-fiscal-year-start').value;
        const invoicePrefix = document.getElementById('firm-invoice-prefix').value;
        const quotePrefix = document.getElementById('firm-quote-prefix').value;
        const poPrefix = document.getElementById('firm-po-prefix').value;
        
        // Document Settings
        const logoUrl = document.getElementById('firm-logo-url').value.trim();
        const invoiceTemplate = document.getElementById('firm-invoice-template').value;
        const enableEInvoice = document.getElementById('firm-enable-e-invoice').checked;

        // Admin Account (only for new firms)
        const adminFullname = document.getElementById('admin-fullname').value.trim();
        const adminUsername = document.getElementById('admin-username').value.trim();
        const adminEmail = document.getElementById('admin-email').value.trim();
        const adminPassword = document.getElementById('admin-password').value.trim();

        if (!name) {
            alert('Firm name is required');
            return;
        }

        try {
            let response;
            const payload = {
                name,
                legal_name: legalName || null,
                address: address || null,
                city: city || null,
                state: state || null,
                country: country || null,
                pincode: pincode || null,
                phone_number: phoneNumber || null,
                secondary_phone: secondaryPhone || null,
                email: email || null,
                website: website || null,
                business_type: businessType || null,
                industry_type: industryType || null,
                establishment_year: establishmentYear ? parseInt(establishmentYear) : null,
                employee_count: employeeCount ? parseInt(employeeCount) : null,
                registration_number: registrationNumber || null,
                registration_date: registrationDate || null,
                cin_number: cinNumber || null,
                pan_number: panNumber || null,
                gst_number: gstNumber || null,
                tax_id: taxId || null,
                vat_number: vatNumber || null,
                bank_account_number: bankAccountNumber || null,
                bank_name: bankName || null,
                bank_branch: bankBranch || null,
                ifsc_code: ifscCode || null,
                payment_terms: paymentTerms || null,
                status,
                license_numbers: licenseNumbers || null,
                insurance_details: insuranceDetails || null,
                currency,
                timezone,
                fiscal_year_start: fiscalYearStart ? parseInt(fiscalYearStart) : null,
                invoice_prefix: invoicePrefix || null,
                quote_prefix: quotePrefix || null,
                po_prefix: poPrefix || null,
                logo_url: logoUrl || null,
                invoice_template: invoiceTemplate || null,
                enable_e_invoice: enableEInvoice
            };

            // Add admin account details if creating new firm and admin fields are provided
            if (!firmId && (adminFullname || adminUsername || adminEmail || adminPassword)) {
                payload.admin_account = {
                    fullname: adminFullname || null,
                    username: adminUsername || null,
                    email: adminEmail || null,
                    password: adminPassword || null
                };
            }

            if (firmId) {
                response = await fetch(`/admin/firm-management/firms/${firmId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/admin/firm-management/firms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Firm saved successfully');
                firmModal.classList.add('hidden');
                window.loadFirmsManagement?.();
                window.loadStats?.();
            } else {
                alert(result.error || 'Failed to save firm');
            }
        } catch (error) {
            console.error('Error saving firm:', error);
            alert('Failed to save firm');
        }
    }

    async function editFirm(firmId) {
        try {
            const response = await fetch(`/admin/firm-management/firms/${firmId}`);
            const data = await response.json();
            if (data.firm) {
                openFirmModal(data.firm);
            } else {
                alert('Failed to fetch firm details');
            }
        } catch (error) {
            console.error('Error fetching firm details:', error);
            alert('Failed to fetch firm details');
        }
    }

    async function deleteFirm(firmId) {
        if (!confirm('Are you sure you want to delete this firm?')) {
            return;
        }

        try {
            const response = await fetch(`/admin/firm-management/firms/${firmId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Firm deleted successfully');
                window.loadFirmsManagement?.();
                window.loadStats?.();
            } else {
                alert(result.error || 'Failed to delete firm');
            }
        } catch (error) {
            console.error('Error deleting firm:', error);
            alert('Failed to delete firm');
        }
    }

    async function assignUserToFirm(userId, firmId) {
        if (!firmId) {
            alert('Please select a firm');
            return;
        }

        try {
            const response = await fetch('/admin/firm-management/assign-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    firmId: parseInt(firmId)
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'User assigned successfully');
                window.loadUserAssignment?.();
            } else {
                alert(result.error || 'Failed to assign user');
            }
        } catch (error) {
            console.error('Error assigning user:', error);
            alert('Failed to assign user');
        }
    }
}


/**
 * GST LOOKUP FUNCTIONALITY FOR FIRMS
 * Fetches firm details from GST API and auto-populates form fields
 */

async function fetchFirmByGST(buttonElement) {
    const gstin = document.getElementById('firm-gst-number').value;
    
    if (!gstin || gstin.length !== 15) {
        alert('Please enter a valid 15-character GSTIN');
        return;
    }

    const fetchButton = buttonElement;
    const originalText = fetchButton.innerHTML;
    fetchButton.innerHTML = '⏳';
    fetchButton.disabled = true;

    try {
        // Using backend proxy (CSP compliant)
        const response = await fetch(`/api/inventory/sales/gst-lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gstin })
        });
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Handle Response: The API might return the data directly or wrapped
        const firmData = data.data || data;
        
        // Use the robust population logic
        populateFirmFromRapidAPI(firmData, gstin);
        
        // Success Feedback
        fetchButton.innerHTML = '✔';
        setTimeout(() => fetchButton.innerHTML = originalText, 1500);

    } catch (error) {
        console.error('Firm GST Lookup Error:', error);
        alert('Failed to fetch details. ' + (error.message || 'Server error'));
        fetchButton.innerHTML = originalText;
    } finally {
        fetchButton.disabled = false;
    }
}

function populateFirmFromRapidAPI(firmData, gstin) {
    console.log('Processing GST Data:', firmData);

    try {
        // Legal name (from legal_name field)
        if (firmData.legal_name && document.getElementById('firm-legal-name')) {
            document.getElementById('firm-legal-name').value = firmData.legal_name;
        }
        
        // Trade name (from trade_name field)
        if (firmData.trade_name && document.getElementById('firm-name')) {
            document.getElementById('firm-name').value = firmData.trade_name;
        }
        
        // Address details from principal place of business
        if (firmData.place_of_business_principal && firmData.place_of_business_principal.address && document.getElementById('firm-address')) {
            const address = formatPowerfulGSTINAddress(firmData);
            if (address && document.getElementById('firm-address')) {
                document.getElementById('firm-address').value = address;
            }
        }
        
        // City
        if (firmData.place_of_business_principal && firmData.place_of_business_principal.address && firmData.place_of_business_principal.address.district && document.getElementById('firm-city')) {
            document.getElementById('firm-city').value = firmData.place_of_business_principal.address.district;
        }
        
        // State
        if (firmData.place_of_business_principal && firmData.place_of_business_principal.address && firmData.place_of_business_principal.address.state && document.getElementById('firm-state')) {
            document.getElementById('firm-state').value = firmData.place_of_business_principal.address.state;
        }
        
        // Pincode
        if (firmData.place_of_business_principal && firmData.place_of_business_principal.address && firmData.place_of_business_principal.address.pin_code && document.getElementById('firm-pincode')) {
            document.getElementById('firm-pincode').value = firmData.place_of_business_principal.address.pin_code;
        }
        
        // PAN (Auto-fill from GSTIN chars 3-12)
        if (gstin && gstin.length >= 12 && document.getElementById('firm-pan-number')) {
            const panValue = gstin.substring(2, 12);
            document.getElementById('firm-pan-number').value = panValue;
        }
        
        // Status
        if (firmData.status && document.getElementById('firm-status')) {
            // Map GST status to our status values
            let statusValue = 'ACTIVE';
            if (firmData.status.toLowerCase().includes('cancel') || firmData.status.toLowerCase().includes('cancelled')) {
                statusValue = 'INACTIVE';
            } else if (firmData.status.toLowerCase().includes('suspended')) {
                statusValue = 'SUSPENDED';
            } else if (firmData.status.toLowerCase().includes('active')) {
                statusValue = 'ACTIVE';
            }
            document.getElementById('firm-status').value = statusValue;
        }
        
        // Business type (from business_constitution)
        if (firmData.business_constitution && document.getElementById('firm-business-type')) {
            document.getElementById('firm-business-type').value = firmData.business_constitution;
        }
        
        // Industry type (from business_activity_nature array)
        if (firmData.business_activity_nature && Array.isArray(firmData.business_activity_nature) && firmData.business_activity_nature.length > 0 && document.getElementById('firm-industry-type')) {
            // Take the first activity if there are multiple
            document.getElementById('firm-industry-type').value = firmData.business_activity_nature[0];
        }
        
        // Registration date (from registration_date)
        if (firmData.registration_date && document.getElementById('firm-registration-date')) {
            // Convert DD/MM/YYYY to YYYY-MM-DD format for date input
            const regDateParts = firmData.registration_date.split('/');
            if (regDateParts.length === 3) {
                const isoDate = `${regDateParts[2]}-${regDateParts[1].padStart(2, '0')}-${regDateParts[0].padStart(2, '0')}`;
                document.getElementById('firm-registration-date').value = isoDate;
            }
        }
        
        // Establishment year (extract from registration date)
        if (firmData.registration_date && document.getElementById('firm-establishment-year')) {
            const regDateParts = firmData.registration_date.split('/');
            if (regDateParts.length === 3) {
                document.getElementById('firm-establishment-year').value = regDateParts[2]; // Year is the third part
            }
        }
        
        console.log('Successfully populated firm details from GSTIN');
    } catch (error) {
        console.error('Error populating firm details from GST data:', error);
    }
}

function formatPowerfulGSTINAddress(firmData) {
    if (!firmData || !firmData.place_of_business_principal || !firmData.place_of_business_principal.address) return '';

    const addr = firmData.place_of_business_principal.address;
    if (!addr) return '';

    const parts = [];

    // Building details
    if (addr.door_num) parts.push(addr.door_num);
    if (addr.building_name) parts.push(addr.building_name);
    if (addr.floor_num) parts.push(addr.floor_num);
    
    // Street and location
    if (addr.street) parts.push(addr.street);
    if (addr.location) parts.push(addr.location);

    // City and district
    if (addr.city && addr.city.trim() !== '') parts.push(addr.city);
    if (addr.district && addr.district.trim() !== '') parts.push(addr.district);
    if (addr.state && addr.state.trim() !== '') parts.push(addr.state);
    
    return parts.filter(p => p && p.toString().trim()).join(', ');
}

function extractPowerfulGSTINPinCode(firmData) {
    if (!firmData || !firmData.place_of_business_principal || !firmData.place_of_business_principal.address) return '';

    const addr = firmData.place_of_business_principal.address;
    if (!addr || !addr.pin_code) return '';

    const pinStr = addr.pin_code.toString().trim();
    // Validate PIN format (6 digits)
    if (/^\d{6}$/.test(pinStr)) {
        return pinStr;
    }

    return '';
}

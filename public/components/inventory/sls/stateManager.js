/**
 * STATE MANAGEMENT MODULE
 * Handles global state initialization, data fetching, and state updates
 */

export function createInitialState() {
    return {
        stocks: [],
        parties: [],
        cart: [],
        selectedParty: null,
        selectedConsignee: null,
        consigneeSameAsBillTo: true,
        historyCache: {},
        meta: {
            billNo: '',
            billDate: new Date().toISOString().split('T')[0],
            billType: 'intra-state',
            reverseCharge: false,
            referenceNo: '',
            vehicleNo: '',
            dispatchThrough: '',
            narration: ''
        },
        otherCharges: [],
        currentFirmName: 'Your Company Name',
        gstEnabled: true
    };
}

export async function fetchCurrentUserFirmName(state) {
    try {
        const response = await fetch('/api/inventory/sales/current-firm', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.name) {
            state.currentFirmName = data.name;
            if (window.currentUserFirmName !== data.name) {
                window.currentUserFirmName = data.name;
            }
        }
    } catch (error) {
        console.warn('Could not fetch current user firm name:', error.message);
        state.currentFirmName = 'Your Company Name';
    }
}

export async function fetchNextBillNumber(state) {
    try {
        const response = await fetch('/api/inventory/sales/next-bill-number', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.nextBillNumber) {
            state.meta.billNo = data.nextBillNumber;
        } else {
            state.meta.billNo = 'Will be generated on save';
        }
    } catch (error) {
        console.warn("Could not fetch next bill number:", error.message);
        state.meta.billNo = 'Will be generated on save';
    }
}

export async function fetchData(state) {
    try {
        // Fetch Stocks
        const stockResponse = await fetch('/api/inventory/sales/stocks', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            state.stocks = Array.isArray(stockData) ? stockData : [];
        } else {
            console.warn('Failed to fetch stocks:', stockResponse.status);
            state.stocks = [];
        }

        // Fetch Parties
        try {
            const partyResponse = await fetch('/api/inventory/sales/parties', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (partyResponse.ok) {
                const partyData = await partyResponse.json();
                state.parties = Array.isArray(partyData) ? partyData : [];
            } else {
                console.warn('Failed to fetch parties:', partyResponse.status);
                state.parties = [];
            }
        } catch (e) {
            console.warn("Could not fetch parties:", e.message);
            state.parties = [];
        }

        // Don't fetch bill number on page load - it will be generated when bill is saved
        // This prevents incrementing the sequence every time the page is visited
        state.meta.billNo = 'Will be generated on save';
        
        // Fetch preview of next bill number (without incrementing sequence)
        try {
            const previewResponse = await fetch('/api/inventory/sales/next-bill-number', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (previewResponse.ok) {
                const data = await previewResponse.json();
                if (data.nextBillNumber) {
                    state.meta.billNo = data.nextBillNumber;
                }
            }
        } catch (error) {
            console.warn("Could not fetch bill number preview:", error.message);
        }
        
        // Fetch GST status
        try {
            const gstResponse = await fetch('/api/settings/system-config/gst-status', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (gstResponse.ok) {
                const gstData = await gstResponse.json();
                state.gstEnabled = gstData.gst_enabled !== false;
            } else {
                console.warn('Failed to fetch GST status:', gstResponse.status);
                state.gstEnabled = true;
            }
        } catch (e) {
            console.warn("Could not fetch GST status:", e.message);
            state.gstEnabled = true;
        }

        return true;
    } catch (err) {
        console.error("Failed to load data:", err);
        throw err;
    }
}

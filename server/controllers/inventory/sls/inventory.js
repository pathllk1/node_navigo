import { Stock, Party, Bill, StockReg, Ledger, Settings, FirmSettings, db } from '../../../utils/db.js';
import { getNextBillNumber } from '../../../utils/billNumberGenerator.js';

// Helper to get current ISO time
const now = () => new Date().toISOString();

const getActorUsername = (req) => (req && req.user && req.user.username ? req.user.username : null);

// --- STOCKS API ---

export const getAllStocks = (req, res) => {
    try {
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        const stocks = Stock.getByFirm.all(req.user.firm_id);
        
        // Parse batches JSON for each stock
        const stocksWithBatches = stocks.map(stock => ({
            ...stock,
            batches: stock.batches ? JSON.parse(stock.batches) : []
        }));
        
        res.json(stocksWithBatches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getPartyItemHistory = (req, res) => {
    try {
        const partyId = parseInt(req.query.partyId);
        const stockId = parseInt(req.query.stockId);
        const limit = req.query.limit === 'all' ? null : Math.min(parseInt(req.query.limit) || 10, 500);

        if (!partyId || !stockId) {
            return res.status(400).json({ error: 'partyId and stockId are required' });
        }

        // Use raw SQL for complex join query
        let query = `
            SELECT 
                sr.id as reg_id,
                sr.stock_id,
                sr.item,
                sr.batch,
                sr.hsn,
                sr.qty,
                sr.uom,
                sr.rate,
                sr.grate,
                sr.disc,
                sr.total,
                sr.bno,
                sr.bdate,
                sr.created_at,
                b.id as bill_id,
                b.party_id,
                b.firm,
                b.usern
            FROM stock_reg sr
            JOIN bills b ON b.id = sr.bill_id
            WHERE b.party_id = ?
              AND sr.stock_id = ?
              AND sr.type = 'SALE'
            ORDER BY COALESCE(sr.bdate, b.bdate, sr.created_at) DESC
        `;
        
        const params = [partyId, stockId];
        
        if (limit !== null) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const rows = db.prepare(query).all(...params);
        
        res.json({ partyId, stockId, rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createStock = (req, res) => {
    try {
        let { item, pno, batch, oem, hsn, qty, uom, rate, grate, mrp, expiryDate, batches } = req.body;

        if ((!batch && !qty && !rate && !mrp && !expiryDate) && batches) {
            try {
                const parsed = Array.isArray(batches) ? batches : JSON.parse(batches);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const b0 = parsed[0] || {};
                    batch = b0.batch ?? batch;
                    qty = b0.qty ?? qty;
                    rate = b0.rate ?? rate;
                    mrp = b0.mrp ?? mrp;
                    expiryDate = b0.expiry ?? expiryDate;
                    batches = parsed;
                }
            } catch (e) {
                // ignore JSON parse issues
            }
        }

        const normalizedBatches = (() => {
            if (!batches) return null;
            try {
                const parsed = Array.isArray(batches) ? batches : JSON.parse(batches);
                return Array.isArray(parsed) ? parsed : null;
            } catch (e) {
                return null;
            }
        })();

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        // Check if item already exists in the same firm
        const existingStock = Stock.getByItem.get(req.user.firm_id, item);
        
        if (existingStock) {
            // Item exists in this firm, update batches JSON
            let existingBatches = existingStock.batches ? JSON.parse(existingStock.batches) : [];
            const incomingBatches = normalizedBatches;

            if (incomingBatches && incomingBatches.length > 0) {
                const b0 = incomingBatches[0] || {};
                batch = b0.batch ?? batch;
                qty = b0.qty ?? qty;
                rate = b0.rate ?? rate;
                mrp = b0.mrp ?? mrp;
                expiryDate = b0.expiry ?? expiryDate;
            }

            // Check if batch already exists
            const existingBatchIndex = existingBatches.findIndex(b => b.batch === batch);

            if (existingBatchIndex !== -1) {
                // Update existing batch
                existingBatches[existingBatchIndex].qty += parseFloat(qty);
                if (mrp !== undefined && mrp !== null && mrp !== '') existingBatches[existingBatchIndex].mrp = parseFloat(mrp);
                if (expiryDate) existingBatches[existingBatchIndex].expiry = expiryDate;
                if (rate !== undefined && rate !== null && rate !== '') existingBatches[existingBatchIndex].rate = parseFloat(rate);
            } else {
                // Add new batch
                existingBatches.push({
                    batch: batch || null,
                    qty: parseFloat(qty),
                    rate: parseFloat(rate),
                    expiry: expiryDate || null,
                    mrp: mrp ? parseFloat(mrp) : null
                });
            }

            // Calculate new total quantity
            const newTotalQty = existingBatches.reduce((sum, b) => sum + b.qty, 0);
            const newTotal = newTotalQty * parseFloat(rate);
            
            // Update the stock record
            Stock.update.run({
                id: existingStock.id,
                firm_id: req.user.firm_id,
                item,
                pno: pno || null,
                oem: oem || null,
                hsn,
                qty: newTotalQty,
                uom,
                rate: parseFloat(rate),
                grate: parseFloat(grate),
                total: newTotal,
                mrp: mrp ? parseFloat(mrp) : null,
                batches: JSON.stringify(existingBatches),
                user: actorUsername
            });
            
            res.json({ id: existingStock.id, message: 'Stock batch updated successfully' });
        } else {
            // Item doesn't exist in this firm, create new record with batch
            const batchesToStore = (normalizedBatches && normalizedBatches.length > 0)
                ? normalizedBatches
                : [{
                    batch: batch || null,
                    qty: parseFloat(qty),
                    rate: parseFloat(rate),
                    expiry: expiryDate || null,
                    mrp: mrp ? parseFloat(mrp) : null
                }];
            
            const total = parseFloat(qty) * parseFloat(rate);

            const result = Stock.create.run({
                firm_id: req.user.firm_id,
                item,
                pno: pno || null,
                oem: oem || null,
                hsn,
                qty: parseFloat(qty),
                uom,
                rate: parseFloat(rate),
                grate: parseFloat(grate),
                total,
                mrp: mrp ? parseFloat(mrp) : null,
                batches: JSON.stringify(batchesToStore),
                user: actorUsername
            });

            res.json({ id: result.lastInsertRowid, message: 'Stock added successfully' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const updateStock = (req, res) => {
    try {
        const { id } = req.params;
        let { item, pno, batch, oem, hsn, qty, uom, rate, grate, mrp, expiryDate, batches: incomingBatches } = req.body;

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        // Get the current stock record
        const currentStock = Stock.getById.get(id, req.user.firm_id);
        if (!currentStock) {
            return res.status(404).json({ error: 'Stock not found or does not belong to your firm' });
        }
        
        // Parse existing batches
        let batches = currentStock.batches ? JSON.parse(currentStock.batches) : [];

        // If UI sent batches JSON (new batch system), prefer it
        if (incomingBatches) {
            try {
                const parsed = Array.isArray(incomingBatches) ? incomingBatches : JSON.parse(incomingBatches);
                if (Array.isArray(parsed)) {
                    batches = parsed;
                }
            } catch (e) {
                // ignore parse errors
            }

            // Derive convenience fields when missing
            const b0 = Array.isArray(batches) && batches.length > 0 ? (batches[0] || {}) : null;
            if (b0) {
                if (!batch && (b0.batch !== undefined)) batch = b0.batch;
                if (!qty && (b0.qty !== undefined)) qty = b0.qty;
                if (!rate && (b0.rate !== undefined)) rate = b0.rate;
                if (!mrp && (b0.mrp !== undefined)) mrp = b0.mrp;
                if (!expiryDate && (b0.expiry !== undefined)) expiryDate = b0.expiry;
            }
        }

        // If batch is specified, update that specific batch
        if (!incomingBatches && batch) {
            const batchIndex = batches.findIndex(b => b.batch === batch);
            if (batchIndex !== -1) {
                // Update existing batch
                batches[batchIndex].qty = parseFloat(qty);
                if (rate) batches[batchIndex].rate = parseFloat(rate);
                if (expiryDate) batches[batchIndex].expiry = expiryDate;
                if (mrp) batches[batchIndex].mrp = parseFloat(mrp);
            } else {
                // If batch doesn't exist in the array, add it
                batches.push({
                    batch: batch,
                    qty: parseFloat(qty),
                    rate: parseFloat(rate),
                    expiry: expiryDate || null,
                    mrp: mrp ? parseFloat(mrp) : null
                });
            }
        } else if (!incomingBatches) {
            // If no batch specified, update the first batch or add as non-batched
            if (batches.length > 0) {
                batches[0].qty = parseFloat(qty);
                if (rate) batches[0].rate = parseFloat(rate);
                if (expiryDate) batches[0].expiry = expiryDate;
                if (mrp) batches[0].mrp = parseFloat(mrp);
            } else {
                // Add as non-batched entry
                batches.push({
                    batch: null,
                    qty: parseFloat(qty),
                    rate: parseFloat(rate),
                    expiry: expiryDate || null,
                    mrp: mrp ? parseFloat(mrp) : null
                });
            }
        }
        
        // Calculate new total quantity
        const newTotalQty = batches.reduce((sum, b) => sum + b.qty, 0);
        const effectiveRate = parseFloat(rate || currentStock.rate || 0);
        const newTotal = newTotalQty * effectiveRate;
        
        Stock.update.run({
            id,
            firm_id: req.user.firm_id,
            item,
            pno: pno || null,
            oem: oem || null,
            hsn,
            qty: newTotalQty,
            uom,
            rate: effectiveRate,
            grate: parseFloat(grate),
            total: newTotal,
            mrp: mrp ? parseFloat(mrp) : null,
            batches: JSON.stringify(batches),
            user: actorUsername
        });

        res.json({ message: 'Stock updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteStock = (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        const result = Stock.delete.run(id, req.user.firm_id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Stock not found or does not belong to your firm' });
        }
        
        res.json({ message: 'Stock deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- PARTIES API ---

export const getAllParties = (req, res) => {
    try {
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        const parties = Party.getByFirm.all(req.user.firm_id);
        res.json(parties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createParty = (req, res) => {
    try {
        const { firm, gstin, contact, state, state_code, addr, pin, pan } = req.body;

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Check if user has firm access
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }
        
        const result = Party.create.run({
            firm_id: req.user.firm_id,
            firm,
            gstin: gstin || 'UNREGISTERED',
            contact: contact || null,
            state: state || '',
            state_code: state_code || null,
            addr: addr || null,
            pin: pin || null,
            pan: pan || null,
            usern: actorUsername,
            supply: state || ''
        });

        res.json({ id: result.lastInsertRowid, message: 'Party created successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// --- BILLS API (Sales Transaction) ---

export const createBill = async (req, res) => {
    // Expects: { meta: {}, party: {}, cart: [], otherCharges: [], consignee: {}, user: '' }
    const { meta, party, cart, otherCharges, consignee } = req.body; 

    const actorUsername = getActorUsername(req);
    if (!actorUsername) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has firm access
    if (!req.user || !req.user.firm_id) {
        return res.status(403).json({ error: 'User is not associated with any firm' });
    }

    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: "Cart cannot be empty" });
    }
    
    // Generate bill number server-side only when bill is actually saved
    let billNo;
    try {
        billNo = await getNextBillNumber(req.user.firm_id);
        console.log(`[CREATE_BILL] Generated bill number: ${billNo}`);
    } catch (error) {
        console.error(`[CREATE_BILL] Failed to generate bill number:`, error.message);
        return res.status(500).json({ error: `Failed to generate bill number: ${error.message}` });
    }
    
    // Set the generated bill number
    meta.billNo = billNo;

    // Check GST status to determine if tax calculations should be performed
    let gstEnabled = true;
    try {
        const firmGstSetting = FirmSettings.getByFirmAndKey.get(req.user.firm_id, 'gst_enabled');
        
        if (firmGstSetting) {
            // Use firm-specific setting
            gstEnabled = firmGstSetting.setting_value === 'true';
        } else {
            // Fall back to global setting if no firm-specific setting exists
            const gstSetting = Settings.getByKey.get('gst_enabled');
            gstEnabled = gstSetting ? gstSetting.setting_value === 'true' : true; // Default to true if not found
        }
    } catch (error) {
        // If there's an error fetching GST settings, default to enabled
        console.warn('Error fetching GST settings, defaulting to enabled:', error.message);
        gstEnabled = true;
    }

    // 1. Calculate Header Totals
    let gtot = 0; // Taxable Total (items + other charges)
    let totalTax = 0; // Tax on items only

    cart.forEach(item => {
        const lineVal = item.qty * item.rate * (1 - (item.disc || 0)/100);
        if (gstEnabled) {
            const lineTax = lineVal * (item.grate / 100);
            totalTax += lineTax;
        }
        gtot += lineVal;
    });

    // Calculate other charges total and their GST
    let otherChargesTotal = 0;
    let otherChargesGstTotal = 0;
    
    if (otherCharges && otherCharges.length > 0) {
        otherCharges.forEach(charge => {
            const chargeAmount = parseFloat(charge.amount) || 0;
            otherChargesTotal += chargeAmount;
            
            if (gstEnabled) {
                const chargeGstRate = parseFloat(charge.gstRate) || 0;
                const chargeGstAmount = (chargeAmount * chargeGstRate) / 100;
                otherChargesGstTotal += chargeGstAmount;
            }
        });
    }
    
    // According to Indian GST Standards (when GST is enabled):
    // gtot = taxable value of items + other charges (total taxable amount)
    gtot = gtot + otherChargesTotal;
    
    // Calculate tax amounts for CGST/SGST or IGST based on supply type (only when GST is enabled)
    let cgst = 0, sgst = 0, igst = 0;
    
    if (gstEnabled && meta.billType === 'intra-state') {
        cgst = (totalTax / 2) + (otherChargesGstTotal / 2); // CGST on items + other charges
        sgst = (totalTax / 2) + (otherChargesGstTotal / 2); // SGST on items + other charges
    } else if (gstEnabled) {
        igst = totalTax + otherChargesGstTotal; // IGST on items + other charges
    }
    
    // For reverse charge, tax is calculated but not added to ntot (grand total)
    // The tax liability shifts to the recipient
    // When GST is disabled, tax values are 0, so ntot = gtot only
    let ntot = gtot + (meta.reverseCharge ? 0 : totalTax + otherChargesGstTotal); // Grand Total
    const roundedNtot = Math.round(ntot);
    const rof = (roundedNtot - ntot).toFixed(2);
    ntot = roundedNtot;
    const supplyState = party.state || 'Local';

    try {
        // A. Insert Bill Header
        const billResult = Bill.create.run({
            firm_id: req.user.firm_id,
            bno: meta.billNo,
            bdate: meta.billDate,
            supply: supplyState,
            addr: party.addr || '',
            gstin: party.gstin || 'UNREGISTERED',
            state: party.state || '',
            pin: party.pin || null,
            state_code: party.state_code || null,
            gtot,
            ntot,
            rof,
            btype: meta.billType ? meta.billType.toUpperCase() : 'SALES',
            usern: actorUsername,
            firm: party.firm,
            party_id: party.id || null,
            oth_chg_json: otherCharges && otherCharges.length > 0 ? JSON.stringify(otherCharges) : null,
            order_no: meta.referenceNo || null,
            vehicle_no: meta.vehicleNo || null,
            dispatch_through: meta.dispatchThrough || null,
            narration: meta.narration || null,
            reverse_charge: meta.reverseCharge || 0,
            cgst,
            sgst,
            igst,
            consignee_name: consignee?.name || null,
            consignee_gstin: consignee?.gstin || null,
            consignee_address: consignee?.address || null,
            consignee_state: consignee?.state || null,
            consignee_pin: consignee?.pin || null,
            consignee_state_code: consignee?.stateCode || null
        });

        const billId = billResult.lastInsertRowid;

        // Process each item in the cart
        for (const item of cart) {
            const lineTotal = item.qty * item.rate * (1 - (item.disc || 0)/100);

            // Get the stock record to update the specific batch
            const stockRecord = Stock.getById.get(item.stockId, req.user.firm_id);
            if (!stockRecord) {
                throw new Error(`Stock record not found for ID: ${item.stockId} or does not belong to your firm`);
            }
            
            // Parse existing batches
            let batches = stockRecord.batches ? JSON.parse(stockRecord.batches) : [];
            
            // Find the specific batch to deduct from
            let batchIndex = -1;
            if (item.batch === null || item.batch === undefined || item.batch === '') {
                // Look for a batch with null/undefined/empty string value
                batchIndex = batches.findIndex(b => b.batch === null || b.batch === undefined || b.batch === '');
            } else {
                batchIndex = batches.findIndex(b => b.batch === item.batch);
            }
            
            if (batchIndex === -1) {
                throw new Error(`Batch ${item.batch} not found for item ${item.item}`);
            }
            
            // Update the specific batch quantity
            batches[batchIndex].qty -= item.qty;
            if (batches[batchIndex].qty < 0) {
                throw new Error(`Insufficient quantity in batch ${item.batch} for item ${item.item}`);
            }
            
            // Calculate new total quantity
            const newTotalQty = batches.reduce((sum, b) => sum + b.qty, 0);
            
            // Update the stock record with new batches and total quantity
            Stock.update.run({
                id: item.stockId,
                firm_id: req.user.firm_id,
                item: stockRecord.item,
                pno: stockRecord.pno,
                oem: stockRecord.oem,
                hsn: stockRecord.hsn,
                qty: newTotalQty,
                uom: stockRecord.uom,
                rate: stockRecord.rate,
                grate: stockRecord.grate,
                total: newTotalQty * stockRecord.rate,
                mrp: stockRecord.mrp,
                batches: JSON.stringify(batches),
                user: actorUsername
            });

            // Insert the stock movement record
            StockReg.create.run({
                firm_id: req.user.firm_id,
                type: 'SALE',
                bno: meta.billNo,
                bdate: meta.billDate,
                supply: supplyState,
                item: item.item,
                item_narration: item.narration || null,
                batch: item.batch || null,
                hsn: item.hsn,
                qty: item.qty,
                uom: item.uom,
                rate: item.rate,
                grate: item.grate,
                disc: item.disc || 0,
                total: lineTotal,
                stock_id: item.stockId,
                bill_id: billId,
                user: actorUsername,
                firm: party.firm,
                qtyh: 0
            });
        }

        // D. Ledger Postings
        const ledgerBase = {
            voucher_id: billId,
            voucher_type: 'SALES',
            voucher_no: meta.billNo,
            bill_id: billId,
            transaction_date: meta.billDate,
            created_by: actorUsername,
            firm_id: req.user.firm_id,
            created_at: now(),
            updated_at: now()
        };

        // 1. Party DR Post
        Ledger.create.run({
            firm_id: ledgerBase.firm_id,
            voucher_id: ledgerBase.voucher_id,
            voucher_type: ledgerBase.voucher_type,
            voucher_no: ledgerBase.voucher_no,
            account_head: party.firm,
            account_type: 'DEBTOR',
            debit_amount: ntot,
            credit_amount: 0,
            narration: `Sales Bill No: ${meta.billNo}`,
            bill_id: ledgerBase.bill_id,
            party_id: party.id || null,
            tax_type: null,
            tax_rate: null,
            transaction_date: ledgerBase.transaction_date,
            created_by: ledgerBase.created_by,
            created_at: ledgerBase.created_at,
            updated_at: ledgerBase.updated_at
        });

        // 2. GST Posts
        if (cgst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'CGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: cgst,
                narration: `CGST on Sales Bill No: ${meta.billNo}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'CGST',
                tax_rate: 9,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }
        if (sgst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'SGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: sgst,
                narration: `SGST on Sales Bill No: ${meta.billNo}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'SGST',
                tax_rate: 9,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }
        if (igst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'IGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: igst,
                narration: `IGST on Sales Bill No: ${meta.billNo}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'IGST',
                tax_rate: 18,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }

        // 3. Round Off Post
        if (Math.abs(parseFloat(rof)) > 0) {
            const rofVal = parseFloat(rof);
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'Round Off',
                account_type: 'EXPENSE',
                debit_amount: rofVal > 0 ? rofVal : 0,
                credit_amount: rofVal < 0 ? Math.abs(rofVal) : 0,
                narration: `Round Off on Sales Bill No: ${meta.billNo}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: null,
                tax_rate: null,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }

        // 4. Other Charges Posts
        if (otherCharges && otherCharges.length > 0) {
            otherCharges.forEach(charge => {
                const chargeAmount = parseFloat(charge.amount) || 0;
                if (chargeAmount > 0) {
                    Ledger.create.run({
                        firm_id: ledgerBase.firm_id,
                        voucher_id: ledgerBase.voucher_id,
                        voucher_type: ledgerBase.voucher_type,
                        voucher_no: ledgerBase.voucher_no,
                        account_head: charge.type || 'Other Charges',
                        account_type: 'INCOME',
                        debit_amount: 0,
                        credit_amount: chargeAmount,
                        narration: `${charge.type} on Sales Bill No: ${meta.billNo}`,
                        bill_id: ledgerBase.bill_id,
                        party_id: null,
                        tax_type: null,
                        tax_rate: null,
                        transaction_date: ledgerBase.transaction_date,
                        created_by: ledgerBase.created_by,
                        created_at: ledgerBase.created_at,
                        updated_at: ledgerBase.updated_at
                    });
                }
            });
        }

        // 5. Sales Account Post (To balance the ledger)
        const taxableItemsTotal = cart.reduce((sum, item) => sum + (item.qty * item.rate * (1 - (item.disc || 0)/100)), 0);
        Ledger.create.run({
            firm_id: ledgerBase.firm_id,
            voucher_id: ledgerBase.voucher_id,
            voucher_type: ledgerBase.voucher_type,
            voucher_no: ledgerBase.voucher_no,
            account_head: 'Sales',
            account_type: 'INCOME',
            debit_amount: 0,
            credit_amount: taxableItemsTotal + otherChargesTotal,
            narration: `Sales Bill No: ${meta.billNo}`,
            bill_id: ledgerBase.bill_id,
            party_id: null,
            tax_type: null,
            tax_rate: null,
            transaction_date: ledgerBase.transaction_date,
            created_by: ledgerBase.created_by,
            created_at: ledgerBase.created_at,
            updated_at: ledgerBase.updated_at
        });

        res.json({ id: billId, billNo: meta.billNo, message: 'Bill created successfully' });
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(400).json({ error: err.message });
    }
};


export const getBillById = (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const bill = Bill.getById.get(id, req.user.firm_id);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Get bill items from stock_reg table
        const items = db.prepare('SELECT * FROM stock_reg WHERE bill_id = ? AND firm_id = ? ORDER BY created_at').all(id, req.user.firm_id);

        // Parse other charges JSON
        const otherCharges = bill.oth_chg_json ? JSON.parse(bill.oth_chg_json) : [];

        res.json({
            ...bill,
            items,
            otherCharges
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllBills = (req, res) => {
    try {
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const bills = Bill.getByFirm.all(req.user.firm_id);

        // Parse other charges JSON for each bill
        const billsWithCharges = bills.map(bill => ({
            ...bill,
            otherCharges: bill.oth_chg_json ? JSON.parse(bill.oth_chg_json) : []
        }));

        res.json(billsWithCharges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta, party, cart, otherCharges, consignee } = req.body;

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: "Cart cannot be empty" });
        }

        // Get the existing bill
        const existingBill = Bill.getById.get(id, req.user.firm_id);
        if (!existingBill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Prevent bill number changes
        if (meta.billNo && meta.billNo !== existingBill.bno) {
            return res.status(400).json({ error: 'Bill number cannot be changed' });
        }

        // Get existing bill items to restore stock quantities
        const existingItems = db.prepare('SELECT * FROM stock_reg WHERE bill_id = ? AND firm_id = ?').all(id, req.user.firm_id);

        // Restore old stock quantities
        for (const existingItem of existingItems) {
            const stockRecord = Stock.getById.get(existingItem.stock_id, req.user.firm_id);
            if (stockRecord) {
                let batches = stockRecord.batches ? JSON.parse(stockRecord.batches) : [];
                
                // Find and update the batch
                const batchIndex = batches.findIndex(b => b.batch === existingItem.batch);
                if (batchIndex !== -1) {
                    batches[batchIndex].qty += existingItem.qty;
                } else {
                    batches.push({
                        batch: existingItem.batch,
                        qty: existingItem.qty,
                        rate: existingItem.rate,
                        expiry: null,
                        mrp: null
                    });
                }
                
                const newTotalQty = batches.reduce((sum, b) => sum + b.qty, 0);
                
                Stock.update.run({
                    id: existingItem.stock_id,
                    firm_id: req.user.firm_id,
                    item: stockRecord.item,
                    pno: stockRecord.pno,
                    oem: stockRecord.oem,
                    hsn: stockRecord.hsn,
                    qty: newTotalQty,
                    uom: stockRecord.uom,
                    rate: stockRecord.rate,
                    grate: stockRecord.grate,
                    total: newTotalQty * stockRecord.rate,
                    mrp: stockRecord.mrp,
                    batches: JSON.stringify(batches),
                    user: actorUsername
                });
            }
        }

        // Calculate new totals (same as createBill)
        let gstEnabled = true;
        try {
            const firmGstSetting = FirmSettings.getByFirmAndKey.get(req.user.firm_id, 'gst_enabled');
            gstEnabled = firmGstSetting ? firmGstSetting.setting_value === 'true' : true;
        } catch (error) {
            gstEnabled = true;
        }

        let gtot = 0, totalTax = 0;
        cart.forEach(item => {
            const lineVal = item.qty * item.rate * (1 - (item.disc || 0)/100);
            if (gstEnabled) {
                const lineTax = lineVal * (item.grate / 100);
                totalTax += lineTax;
            }
            gtot += lineVal;
        });

        let otherChargesTotal = 0, otherChargesGstTotal = 0;
        if (otherCharges && otherCharges.length > 0) {
            otherCharges.forEach(charge => {
                const chargeAmount = parseFloat(charge.amount) || 0;
                otherChargesTotal += chargeAmount;
                if (gstEnabled) {
                    const chargeGstRate = parseFloat(charge.gstRate) || 0;
                    const chargeGstAmount = (chargeAmount * chargeGstRate) / 100;
                    otherChargesGstTotal += chargeGstAmount;
                }
            });
        }

        gtot = gtot + otherChargesTotal;

        let cgst = 0, sgst = 0, igst = 0;
        if (gstEnabled && meta.billType === 'intra-state') {
            cgst = (totalTax / 2) + (otherChargesGstTotal / 2);
            sgst = (totalTax / 2) + (otherChargesGstTotal / 2);
        } else if (gstEnabled) {
            igst = totalTax + otherChargesGstTotal;
        }

        let ntot = gtot + (meta.reverseCharge ? 0 : totalTax + otherChargesGstTotal);
        const roundedNtot = Math.round(ntot);
        const rof = (roundedNtot - ntot).toFixed(2);
        ntot = roundedNtot;

        // Update Bill Header
        Bill.update.run({
            id,
            firm_id: req.user.firm_id,
            bno: existingBill.bno,
            bdate: meta.billDate,
            supply: party.state || 'Local',
            addr: party.addr || '',
            gstin: party.gstin || 'UNREGISTERED',
            state: party.state || '',
            pin: party.pin || null,
            state_code: party.state_code || null,
            gtot,
            ntot,
            rof,
            btype: meta.billType ? meta.billType.toUpperCase() : 'SALES',
            usern: actorUsername,
            firm: party.firm,
            party_id: party.id || null,
            oth_chg_json: otherCharges && otherCharges.length > 0 ? JSON.stringify(otherCharges) : null,
            order_no: meta.referenceNo || null,
            vehicle_no: meta.vehicleNo || null,
            dispatch_through: meta.dispatchThrough || null,
            narration: meta.narration || null,
            reverse_charge: meta.reverseCharge || 0,
            cgst,
            sgst,
            igst,
            consignee_name: consignee?.name || null,
            consignee_gstin: consignee?.gstin || null,
            consignee_address: consignee?.address || null,
            consignee_state: consignee?.state || null,
            consignee_pin: consignee?.pin || null,
            consignee_state_code: consignee?.stateCode || null
        });

        // Delete existing stock_reg entries
        db.prepare('DELETE FROM stock_reg WHERE bill_id = ? AND firm_id = ?').run(id, req.user.firm_id);

        // Process new items
        for (const item of cart) {
            const lineTotal = item.qty * item.rate * (1 - (item.disc || 0)/100);

            const stockRecord = Stock.getById.get(item.stockId, req.user.firm_id);
            if (!stockRecord) {
                throw new Error(`Stock record not found for ID: ${item.stockId}`);
            }

            let batches = stockRecord.batches ? JSON.parse(stockRecord.batches) : [];
            let batchIndex = -1;
            if (item.batch === null || item.batch === undefined || item.batch === '') {
                batchIndex = batches.findIndex(b => b.batch === null || b.batch === undefined || b.batch === '');
            } else {
                batchIndex = batches.findIndex(b => b.batch === item.batch);
            }

            if (batchIndex === -1) {
                throw new Error(`Batch ${item.batch} not found for item ${item.item}`);
            }

            batches[batchIndex].qty -= item.qty;
            if (batches[batchIndex].qty < 0) {
                throw new Error(`Insufficient quantity in batch ${item.batch}`);
            }

            const newTotalQty = batches.reduce((sum, b) => sum + b.qty, 0);

            Stock.update.run({
                id: item.stockId,
                firm_id: req.user.firm_id,
                item: stockRecord.item,
                pno: stockRecord.pno,
                oem: stockRecord.oem,
                hsn: stockRecord.hsn,
                qty: newTotalQty,
                uom: stockRecord.uom,
                rate: stockRecord.rate,
                grate: stockRecord.grate,
                total: newTotalQty * stockRecord.rate,
                mrp: stockRecord.mrp,
                batches: JSON.stringify(batches),
                user: actorUsername
            });

            StockReg.create.run({
                firm_id: req.user.firm_id,
                type: 'SALE',
                bno: existingBill.bno,
                bdate: meta.billDate,
                supply: party.state || 'Local',
                item: item.item,
                item_narration: item.narration || null,
                batch: item.batch || null,
                hsn: item.hsn,
                qty: item.qty,
                uom: item.uom,
                rate: item.rate,
                grate: item.grate,
                disc: item.disc || 0,
                total: lineTotal,
                stock_id: item.stockId,
                bill_id: id,
                user: actorUsername,
                firm: party.firm,
                qtyh: 0
            });
        }

        // Delete old ledger entries
        db.prepare('DELETE FROM ledger WHERE voucher_id = ? AND voucher_type = ? AND firm_id = ?').run(id, 'SALES', req.user.firm_id);

        // Create new ledger entries (same as createBill)
        const ledgerBase = {
            voucher_id: id,
            voucher_type: 'SALES',
            voucher_no: existingBill.bno,
            bill_id: id,
            transaction_date: meta.billDate,
            created_by: actorUsername,
            firm_id: req.user.firm_id,
            created_at: now(),
            updated_at: now()
        };

        // Party DR Post
        Ledger.create.run({
            firm_id: ledgerBase.firm_id,
            voucher_id: ledgerBase.voucher_id,
            voucher_type: ledgerBase.voucher_type,
            voucher_no: ledgerBase.voucher_no,
            account_head: party.firm,
            account_type: 'DEBTOR',
            debit_amount: ntot,
            credit_amount: 0,
            narration: `Sales Bill No: ${existingBill.bno}`,
            bill_id: ledgerBase.bill_id,
            party_id: party.id || null,
            tax_type: null,
            tax_rate: null,
            transaction_date: ledgerBase.transaction_date,
            created_by: ledgerBase.created_by,
            created_at: ledgerBase.created_at,
            updated_at: ledgerBase.updated_at
        });

        // GST Posts
        if (cgst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'CGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: cgst,
                narration: `CGST on Sales Bill No: ${existingBill.bno}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'CGST',
                tax_rate: 9,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }
        if (sgst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'SGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: sgst,
                narration: `SGST on Sales Bill No: ${existingBill.bno}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'SGST',
                tax_rate: 9,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }
        if (igst > 0) {
            Ledger.create.run({
                firm_id: ledgerBase.firm_id,
                voucher_id: ledgerBase.voucher_id,
                voucher_type: ledgerBase.voucher_type,
                voucher_no: ledgerBase.voucher_no,
                account_head: 'IGST Payable',
                account_type: 'LIABILITY',
                debit_amount: 0,
                credit_amount: igst,
                narration: `IGST on Sales Bill No: ${existingBill.bno}`,
                bill_id: ledgerBase.bill_id,
                party_id: null,
                tax_type: 'IGST',
                tax_rate: 18,
                transaction_date: ledgerBase.transaction_date,
                created_by: ledgerBase.created_by,
                created_at: ledgerBase.created_at,
                updated_at: ledgerBase.updated_at
            });
        }

        // Sales Account Post
        const taxableItemsTotal = cart.reduce((sum, item) => sum + (item.qty * item.rate * (1 - (item.disc || 0)/100)), 0);
        Ledger.create.run({
            firm_id: ledgerBase.firm_id,
            voucher_id: ledgerBase.voucher_id,
            voucher_type: ledgerBase.voucher_type,
            voucher_no: ledgerBase.voucher_no,
            account_head: 'Sales',
            account_type: 'INCOME',
            debit_amount: 0,
            credit_amount: taxableItemsTotal + otherChargesTotal,
            narration: `Sales Bill No: ${existingBill.bno}`,
            bill_id: ledgerBase.bill_id,
            party_id: null,
            tax_type: null,
            tax_rate: null,
            transaction_date: ledgerBase.transaction_date,
            created_by: ledgerBase.created_by,
            created_at: ledgerBase.created_at,
            updated_at: ledgerBase.updated_at
        });

        res.json({ message: 'Bill updated successfully' });
    } catch (err) {
        console.error('Error updating bill:', err);
        res.status(400).json({ error: err.message });
    }
};

export const cancelBill = (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const bill = Bill.getById.get(id, req.user.firm_id);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        if (bill.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Bill is already cancelled' });
        }

        // Get bill items
        const items = db.prepare('SELECT * FROM stock_reg WHERE bill_id = ? AND firm_id = ?').all(id, req.user.firm_id);

        // Restore stock quantities
        for (const item of items) {
            const stockRecord = Stock.getById.get(item.stock_id, req.user.firm_id);
            if (stockRecord) {
                let batches = stockRecord.batches ? JSON.parse(stockRecord.batches) : [];
                const batchIndex = batches.findIndex(b => b.batch === item.batch);
                if (batchIndex !== -1) {
                    batches[batchIndex].qty += item.qty;
                } else {
                    batches.push({
                        batch: item.batch,
                        qty: item.qty,
                        rate: item.rate,
                        expiry: null,
                        mrp: null
                    });
                }

                const newTotalQty = batches.reduce((sum, b) => sum + b.qty, 0);

                Stock.update.run({
                    id: item.stock_id,
                    firm_id: req.user.firm_id,
                    item: stockRecord.item,
                    pno: stockRecord.pno,
                    oem: stockRecord.oem,
                    hsn: stockRecord.hsn,
                    qty: newTotalQty,
                    uom: stockRecord.uom,
                    rate: stockRecord.rate,
                    grate: stockRecord.grate,
                    total: newTotalQty * stockRecord.rate,
                    mrp: stockRecord.mrp,
                    batches: JSON.stringify(batches),
                    user: actorUsername
                });
            }
        }

        // Delete ledger entries
        db.prepare('DELETE FROM ledger WHERE voucher_id = ? AND voucher_type = ? AND firm_id = ?').run(id, 'SALES', req.user.firm_id);

        // Update bill status
        Bill.updateStatus.run({
            id,
            firm_id: req.user.firm_id,
            status: 'CANCELLED',
            cancellation_reason: reason || null,
            cancelled_at: now(),
            cancelled_by: req.user.id
        });

        res.json({ message: 'Bill cancelled successfully' });
    } catch (err) {
        console.error('Error cancelling bill:', err);
        res.status(500).json({ error: err.message });
    }
};


// --- STOCK MOVEMENTS API ---

export const getStockBatches = (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const stock = Stock.getById.get(id, req.user.firm_id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const batches = stock.batches ? JSON.parse(stock.batches) : [];
        res.json({ id, item: stock.item, batches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStockMovements = (req, res) => {
    try {
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const { type, batchFilter, searchTerm, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = `
            SELECT sr.*, s.item as stock_item, b.bdate as bill_date
            FROM stock_reg sr
            LEFT JOIN stocks s ON s.id = sr.stock_id
            LEFT JOIN bills b ON b.id = sr.bill_id
            WHERE sr.firm_id = ?
        `;
        
        const params = [req.user.firm_id];

        if (type) {
            query += ` AND sr.type = ?`;
            params.push(type);
        }

        if (batchFilter) {
            query += ` AND sr.batch = ?`;
            params.push(batchFilter);
        }

        if (searchTerm) {
            query += ` AND (sr.item LIKE ? OR sr.bno LIKE ?)`;
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ` ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const rows = db.prepare(query).all(...params);
        res.json({ page: parseInt(page), limit: parseInt(limit), rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStockMovementsByStock = (req, res) => {
    try {
        const { stockId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const rows = db.prepare(`
            SELECT * FROM stock_reg 
            WHERE stock_id = ? AND firm_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(stockId, req.user.firm_id, parseInt(limit), offset);

        res.json({ stockId, page: parseInt(page), limit: parseInt(limit), rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createStockMovement = (req, res) => {
    try {
        const { type, stockId, batch, qty, uom, rate, total, description, referenceNumber } = req.body;

        // Validate required fields
        if (!type || !stockId || !qty || !uom) {
            return res.status(400).json({ error: 'Type, stockId, qty, and uom are required' });
        }

        const validTypes = ['RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'OPENING'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid movement type. Must be one of: RECEIPT, TRANSFER, ADJUSTMENT, OPENING' });
        }

        const actorUsername = getActorUsername(req);
        if (!actorUsername) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const stock = Stock.getById.get(stockId, req.user.firm_id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found or does not belong to your firm' });
        }

        // Calculate total if not provided
        const calculatedTotal = total || (qty * (rate || 0));

        // Insert the stock movement record
        StockReg.create.run({
            firm_id: req.user.firm_id,
            type,
            bno: referenceNumber || null,
            bdate: new Date().toISOString().split('T')[0],
            supply: 'INTERNAL',
            item: stock.item,
            item_narration: description || null,
            batch: batch || null,
            hsn: stock.hsn,
            qty: Math.abs(parseFloat(qty)),
            uom: uom,
            rate: rate || 0,
            grate: stock.grate || 0,
            disc: 0,
            total: calculatedTotal,
            stock_id: stockId,
            bill_id: null,
            user: actorUsername,
            firm: stock.firm || 'Internal',
            qtyh: 0
        });

        // Update the stock quantity based on movement type
        let newQty = (stock.qty || 0) + Math.abs(parseFloat(qty));

        Stock.update.run({
            id: stockId,
            firm_id: req.user.firm_id,
            item: stock.item,
            pno: stock.pno,
            oem: stock.oem,
            hsn: stock.hsn,
            qty: newQty,
            uom: uom || stock.uom,
            rate: rate || stock.rate,
            grate: stock.grate,
            total: newQty * (rate || stock.rate),
            mrp: stock.mrp,
            batches: stock.batches,
            user: actorUsername
        });

        res.json({ message: `Stock movement (${type}) created successfully` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// --- UTILITY ENDPOINTS ---

export const getOtherChargesTypes = (req, res) => {
    try {
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const rows = db.prepare(`
            SELECT DISTINCT json_extract(oth_chg_json, '$[0].type') as type
            FROM bills
            WHERE firm_id = ? AND oth_chg_json IS NOT NULL
            ORDER BY type
        `).all(req.user.firm_id);

        const types = rows.map(r => r.type).filter(t => t !== null);
        res.json({ types });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getNextBillNumberPreviewEndpoint = async (req, res) => {
    try {
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const billNo = getNextBillNumber(req.user.firm_id, 'SALES');
        res.json({ nextBillNumber: billNo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getCurrentUserFirmName = (req, res) => {
    try {
        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const firm = db.prepare('SELECT name, address FROM firms WHERE id = ?').get(req.user.firm_id);
        
        if (!firm) {
            return res.status(404).json({ error: 'Firm not found' });
        }

        res.json(firm);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getPartyBalance = (req, res) => {
    try {
        const { partyId } = req.params;

        if (!req.user || !req.user.firm_id) {
            return res.status(403).json({ error: 'User is not associated with any firm' });
        }

        const result = db.prepare(`
            SELECT 
                SUM(CASE WHEN account_type = 'DEBTOR' THEN debit_amount ELSE 0 END) as total_debit,
                SUM(CASE WHEN account_type = 'DEBTOR' THEN credit_amount ELSE 0 END) as total_credit
            FROM ledger
            WHERE firm_id = ? AND party_id = ?
        `).get(req.user.firm_id, partyId);

        const balance = (result.total_debit || 0) - (result.total_credit || 0);
        res.json({ partyId, balance, debit: result.total_debit || 0, credit: result.total_credit || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const lookupGST = async (req, res) => {
    // Accept GSTIN from either query params (GET) or body (POST)
    const gstin = req.query.gstin || req.body?.gstin;

    if (!gstin) {
        return res.status(400).json({ error: 'GSTIN is required' });
    }

    // RAPID API CONFIG (Keep your secrets on the server!)
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const url = `https://powerful-gstin-tool.p.rapidapi.com/v1/gstin/${gstin}/details`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'powerful-gstin-tool.p.rapidapi.com'
            }
        });

        const data = await response.json();
        
        // Pass the data back to your frontend
        res.json(data);

    } catch (error) {
        console.error('GST API Error:', error);
        res.status(500).json({ error: 'Failed to fetch GST details' });
    }
};

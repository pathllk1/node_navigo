/**
 * INVOICE EXPORT COMPONENT
 * Handles invoice export to Excel and PDF formats
 */

export function exportInvoiceToExcel(state, formatCurrency) {
    try {
        // Create CSV content
        let csv = 'INVOICE EXPORT\n';
        csv += `Bill No,${state.meta.billNo}\n`;
        csv += `Date,${state.meta.billDate}\n`;
        csv += `Bill Type,${state.meta.billType}\n`;
        csv += `Reverse Charge,${state.meta.reverseCharge ? 'Yes' : 'No'}\n\n`;

        if (state.selectedParty) {
            csv += 'BILL TO\n';
            csv += `Party,${state.selectedParty.firm}\n`;
            csv += `GSTIN,${state.selectedParty.gstin}\n`;
            csv += `Address,${state.selectedParty.addr}\n\n`;
        }

        if (state.selectedConsignee) {
            csv += 'CONSIGNEE\n';
            csv += `Name,${state.selectedConsignee.name}\n`;
            csv += `Address,${state.selectedConsignee.address}\n\n`;
        }

        csv += 'ITEMS\n';
        csv += 'Item,Batch,Qty,Unit,Rate,Disc %,Tax %,Total\n';
        
        state.cart.forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            const disc = parseFloat(item.disc) || 0;
            const tax = parseFloat(item.tax) || 0;
            
            const discAmount = (qty * rate * disc) / 100;
            const taxableAmount = (qty * rate) - discAmount;
            const taxAmount = (taxableAmount * tax) / 100;
            const total = taxableAmount + taxAmount;
            
            csv += `"${item.item}","${item.batch || '-'}",${qty},${item.uom},${rate},${disc},${tax},${total}\n`;
        });

        csv += '\nOTHER CHARGES\n';
        csv += 'Charge,Amount,GST %,Total\n';
        
        state.otherCharges.forEach(charge => {
            const amount = parseFloat(charge.amount) || 0;
            const gstRate = parseFloat(charge.gstRate) || 0;
            const gstAmount = (amount * gstRate) / 100;
            const total = amount + gstAmount;
            
            csv += `"${charge.name}",${amount},${gstRate},${total}\n`;
        });

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Invoice_${state.meta.billNo}_${state.meta.billDate}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Invoice exported to Excel successfully!');
    } catch (err) {
        console.error('Export error:', err);
        alert('Error exporting invoice: ' + err.message);
    }
}

export function exportInvoiceToPDF(state, formatCurrency) {
    try {
        // Simple PDF generation using basic HTML to PDF approach
        // For production, consider using a library like jsPDF or pdfkit
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${state.meta.billNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-details { margin-bottom: 20px; }
                    .party-info { display: flex; gap: 40px; margin-bottom: 20px; }
                    .party-section { flex: 1; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .total-row { font-weight: bold; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${state.currentFirmName}</h1>
                    <h2>INVOICE</h2>
                </div>

                <div class="invoice-details">
                    <p><strong>Bill No:</strong> ${state.meta.billNo}</p>
                    <p><strong>Date:</strong> ${state.meta.billDate}</p>
                    <p><strong>Type:</strong> ${state.meta.billType}</p>
                </div>

                <div class="party-info">
                    <div class="party-section">
                        <h4>BILL TO</h4>
                        ${state.selectedParty ? `
                            <p><strong>${state.selectedParty.firm}</strong></p>
                            <p>GSTIN: ${state.selectedParty.gstin}</p>
                            <p>${state.selectedParty.addr}</p>
                        ` : '<p>No party selected</p>'}
                    </div>
                    
                    <div class="party-section">
                        <h4>CONSIGNEE</h4>
                        ${state.selectedConsignee ? `
                            <p><strong>${state.selectedConsignee.name}</strong></p>
                            <p>${state.selectedConsignee.address}</p>
                        ` : '<p>Same as Bill To</p>'}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Batch</th>
                            <th class="text-right">Qty</th>
                            <th>Unit</th>
                            <th class="text-right">Rate</th>
                            <th class="text-right">Disc %</th>
                            <th class="text-right">Tax %</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.cart.map((item, idx) => {
                            const qty = parseFloat(item.qty) || 0;
                            const rate = parseFloat(item.rate) || 0;
                            const disc = parseFloat(item.disc) || 0;
                            const tax = parseFloat(item.tax) || 0;
                            
                            const discAmount = (qty * rate * disc) / 100;
                            const taxableAmount = (qty * rate) - discAmount;
                            const taxAmount = (taxableAmount * tax) / 100;
                            const total = taxableAmount + taxAmount;
                            
                            return `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${item.item}</td>
                                    <td>${item.batch || '-'}</td>
                                    <td class="text-right">${qty}</td>
                                    <td>${item.uom}</td>
                                    <td class="text-right">${rate}</td>
                                    <td class="text-right">${disc}</td>
                                    <td class="text-right">${tax}</td>
                                    <td class="text-right">${total.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                ${state.otherCharges.length > 0 ? `
                    <h4>Other Charges</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Charge</th>
                                <th class="text-right">Amount</th>
                                <th class="text-right">GST %</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.otherCharges.map(charge => {
                                const amount = parseFloat(charge.amount) || 0;
                                const gstRate = parseFloat(charge.gstRate) || 0;
                                const gstAmount = (amount * gstRate) / 100;
                                const total = amount + gstAmount;
                                
                                return `
                                    <tr>
                                        <td>${charge.name}</td>
                                        <td class="text-right">${amount.toFixed(2)}</td>
                                        <td class="text-right">${gstRate}</td>
                                        <td class="text-right">${total.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <p style="text-align: right; margin-top: 20px;">
                    <strong>Grand Total: ${formatCurrency(calculateGrandTotal(state))}</strong>
                </p>
            </body>
            </html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        
    } catch (err) {
        console.error('PDF export error:', err);
        alert('Error exporting to PDF: ' + err.message);
    }
}

function calculateGrandTotal(state) {
    let subtotal = 0;
    let totalTax = 0;

    state.cart.forEach(item => {
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const disc = parseFloat(item.disc) || 0;
        const tax = parseFloat(item.tax) || 0;
        
        const discAmount = (qty * rate * disc) / 100;
        const taxableAmount = (qty * rate) - discAmount;
        const taxAmount = (taxableAmount * tax) / 100;
        
        subtotal += taxableAmount;
        totalTax += taxAmount;
    });

    state.otherCharges.forEach(charge => {
        const amount = parseFloat(charge.amount) || 0;
        const gstRate = parseFloat(charge.gstRate) || 0;
        const gstAmount = (amount * gstRate) / 100;
        
        subtotal += amount;
        totalTax += gstAmount;
    });

    return subtotal + totalTax;
}

import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
const translations = {
    en: {
        invoice: 'INVOICE',
        billFrom: 'BILL FROM',
        billTo: 'BILL TO',
        invoiceDate: 'Invoice Date',
        dueDate: 'Due Date',
        status: 'Status',
        description: 'Description',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        taxPercent: 'Tax %',
        amount: 'Amount',
        taxSummary: 'Tax Summary',
        totalTax: 'Total Tax',
        totals: 'Totals',
        subtotal: 'Subtotal',
        totalHT: 'Total Before Tax',
        tax: 'Tax',
        totalDue: 'Total Due',
        totalTTC: 'Total With Tax',
        stamp: 'Stamp',
        notes: 'Notes',
        client: 'CLIENT',
        fiscalNumber: 'Fiscal Number'
    },
    fr: {
        invoice: 'FACTURE',
        billFrom: 'FACTURER PAR',
        billTo: 'FACTURER À',
        invoiceDate: 'Date de facture',
        dueDate: 'Date d\'échéance',
        status: 'Statut',
        description: 'Désignation',
        quantity: 'Quantité',
        unitPrice: 'Prix unitaire',
        taxPercent: 'Taxe %',
        amount: 'Total',
        taxSummary: 'Résumé des taxes',
        totalTax: 'Total des taxes',
        totals: 'Totaux',
        subtotal: 'Total HT',
        totalHT: 'Total HT',
        tax: 'TVA',
        totalDue: 'Total dû',
        totalTTC: 'Total TTC',
        stamp: 'Timbre',
        notes: 'Remarques',
        client: 'CLIENT',
        fiscalNumber: 'Matricule Fiscale'
    },
    es: {
        invoice: 'FACTURA',
        billFrom: 'FACTURADO POR',
        billTo: 'FACTURADO A',
        invoiceDate: 'Fecha de factura',
        dueDate: 'Fecha de vencimiento',
        status: 'Estado',
        description: 'Descripción',
        quantity: 'Cantidad',
        unitPrice: 'Precio unitario',
        taxPercent: 'Impuesto %',
        amount: 'Cantidad',
        taxSummary: 'Resumen de impuestos',
        totalTax: 'Impuesto total',
        totals: 'Totales',
        subtotal: 'Subtotal',
        totalHT: 'Subtotal',
        tax: 'Impuesto',
        totalDue: 'Total adeudado',
        totalTTC: 'Total',
        stamp: 'Sello',
        notes: 'Notas',
        client: 'CLIENTE',
        fiscalNumber: 'Número Fiscal'
    },
    de: {
        invoice: 'RECHNUNG',
        billFrom: 'RECHNUNGSANSCHRIFT VON',
        billTo: 'RECHNUNG AN',
        invoiceDate: 'Rechnungsdatum',
        dueDate: 'Fälligkeitsdatum',
        status: 'Status',
        description: 'Beschreibung',
        quantity: 'Menge',
        unitPrice: 'Stückpreis',
        taxPercent: 'Steuern %',
        amount: 'Betrag',
        taxSummary: 'Steuerzusammenfassung',
        totalTax: 'Gesamtsteuern',
        totals: 'Summen',
        subtotal: 'Zwischensumme',
        totalHT: 'Zwischensumme',
        tax: 'Steuern',
        totalDue: 'Gesamtfällig',
        totalTTC: 'Gesamtbetrag',
        stamp: 'Stempel',
        notes: 'Notizen',
        client: 'KUNDE',
        fiscalNumber: 'Steuernummer'
    },
    it: {
        invoice: 'FATTURA',
        billFrom: 'FATTURATO DA',
        billTo: 'FATTURATO A',
        invoiceDate: 'Data della fattura',
        dueDate: 'Data di scadenza',
        status: 'Stato',
        description: 'Descrizione',
        quantity: 'Quantità',
        unitPrice: 'Prezzo unitario',
        taxPercent: 'Imposta %',
        amount: 'Importo',
        taxSummary: 'Riepilogo imposte',
        totalTax: 'Imposta totale',
        totals: 'Totali',
        subtotal: 'Subtotale',
        totalHT: 'Subtotale',
        tax: 'Imposta',
        totalDue: 'Totale dovuto',
        totalTTC: 'Totale',
        stamp: 'Bollo',
        notes: 'Note',
        client: 'CLIENTE',
        fiscalNumber: 'Numero Fiscale'
    },
    pt: {
        invoice: 'FATURA',
        billFrom: 'FATURADO POR',
        billTo: 'FATURADO PARA',
        invoiceDate: 'Data da fatura',
        dueDate: 'Data de vencimento',
        status: 'Status',
        description: 'Descrição',
        quantity: 'Quantidade',
        unitPrice: 'Preço unitário',
        taxPercent: 'Imposto %',
        amount: 'Montante',
        taxSummary: 'Resumo de impostos',
        totalTax: 'Imposto total',
        totals: 'Totais',
        subtotal: 'Subtotal',
        totalHT: 'Subtotal',
        tax: 'Imposto',
        totalDue: 'Total devido',
        totalTTC: 'Total',
        stamp: 'Selo',
        notes: 'Notas',
        client: 'CLIENTE',
        fiscalNumber: 'Número Fiscal'
    },
    ar: {
        invoice: 'الفاتورة',
        billFrom: 'بيانات المُصدِّر',
        billTo: 'بيانات المُستلِم',
        invoiceDate: 'تاريخ الفاتورة',
        dueDate: 'تاريخ الاستحقاق',
        status: 'الحالة',
        description: 'الوصف',
        quantity: 'الكمية',
        unitPrice: 'السعر الموحد',
        taxPercent: 'الضريبة %',
        amount: 'المبلغ',
        taxSummary: 'ملخص الضرائب',
        totalTax: 'إجمالي الضريبة',
        totals: 'الإجماليات',
        subtotal: 'المجموع الجزئي',
        totalHT: 'المجموع الجزئي',
        tax: 'الضريبة',
        totalDue: 'المبلغ المستحق',
        totalTTC: 'المجموع الكلي',
        stamp: 'الختم',
        notes: 'ملاحظات',
        client: 'العميل',
        fiscalNumber: 'الرقم الضريبي'
    }
};
const InvoiceTemplate = ({ invoice, customer, workOrder, settings }) => {
    const language = (settings?.language || 'en');
    const t = translations[language] || translations['en'];
    const companyName = settings?.companyName || 'Smart FSM';
    const companyTax = settings?.companyTax || 'MF: 1234567890/K';
    const companyAddress = settings?.companyAddress || 'Your Company Address';
    const companyPhone = settings?.companyPhone || '';
    const companyEmail = settings?.companyEmail || '';
    const logoUrl = settings?.logoUrl;
    const footerText = settings?.footerText || 'Thank you for your business!';
    const safeSubtotal = Number(invoice.subtotal || 0);
    const safeTaxAmount = Number(invoice.taxAmount || 0);
    const safeTotal = Number(invoice.total || 0);
    const safeStampFee = Number(invoice.stampFee || 0);
    const safeLineItems = invoice.lineItems || [];
    const calculateTaxByRate = (lineItems) => {
        const taxes = {};
        lineItems.forEach(item => {
            const rate = item.taxRate;
            const itemTax = (item.quantity * item.unitPrice * rate) / 100;
            taxes[rate] = (taxes[rate] || 0) + itemTax;
        });
        return taxes;
    };
    const taxesByRate = calculateTaxByRate(safeLineItems);
    const getTaxPercentage = () => {
        const rates = Object.keys(taxesByRate);
        if (rates.length > 0)
            return rates[0];
        return safeLineItems.length > 0 ? safeLineItems[0].taxRate : 0;
    };
    return (_jsxs("div", { style: {
            fontFamily: 'Arial, sans-serif',
            color: '#000',
            lineHeight: '1.4',
            padding: '20px',
            backgroundColor: '#ffffff',
            maxWidth: '900px',
            overflow: 'auto'
        }, children: [_jsx("div", { style: { marginBottom: '20px' }, children: _jsx("table", { style: { width: '100%' }, children: _jsx("tbody", { children: _jsxs("tr", { children: [_jsxs("td", { style: { width: '60%' }, children: [_jsxs("h1", { style: { margin: '0 0 5px 0', fontSize: '20px', color: '#146bdcff', fontWeight: 'bold' }, children: ["Ste ", companyName] }), _jsx("p", { style: { margin: '3px 0', fontSize: '11px', color: '#146bdcff', fontWeight: 'bold' }, children: companyAddress }), _jsx("p", { style: { margin: '3px 0', fontSize: '11px', color: '#000' }, children: companyTax && `${t.fiscalNumber}: ${companyTax}` })] }), _jsxs("td", { style: { width: '40%', textAlign: 'right', verticalAlign: 'top', fontSize: '11px' }, children: [companyPhone && _jsxs("p", { style: { margin: '0' }, children: ["T\u00E9l : ", companyPhone] }), companyEmail && _jsxs("p", { style: { margin: '3px 0 0 0' }, children: ["e-mail : ", companyEmail] }), settings?.companyWebsite && _jsxs("p", { style: { margin: '3px 0 0 0' }, children: ["Site : ", settings.companyWebsite] })] })] }) }) }) }), _jsxs("div", { style: { marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { border: '2px solid #000', padding: '10px', marginBottom: '10px' }, children: [_jsx("p", { style: { margin: '0', fontSize: '10px', fontWeight: 'bold' }, children: "Date" }), _jsx("p", { style: { margin: '5px 0 0 0', fontSize: '11px', color: '#000000ff', fontWeight: 'bold' }, children: new Date(invoice.issueDate).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        }) })] }), _jsxs("div", { style: { border: '2px solid #000', padding: '10px' }, children: [_jsx("p", { style: { margin: '0', fontSize: '10px', fontWeight: 'bold' }, children: "Facture" }), _jsx("p", { style: { margin: '5px 0 0 0', fontSize: '14px', color: '#146bdcff', fontWeight: 'bold' }, children: invoice.id })] })] }), _jsxs("div", { style: { border: '2px solid #000', padding: '10px' }, children: [_jsx("p", { style: { margin: '0', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }, children: t.client }), _jsx("p", { style: { margin: '8px 0 0 0', fontSize: '11px', fontWeight: 'bold' }, children: customer?.name || 'Customer Name' }), _jsx("p", { style: { margin: '3px 0', fontSize: '10px' }, children: customer?.location?.address || 'Address' }), customer && customer.fiscalNumber && (_jsxs("p", { style: { margin: '3px 0', fontSize: '10px' }, children: [t.fiscalNumber, ": ", customer.fiscalNumber] }))] })] }), _jsx("div", { style: { marginBottom: '20px' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '10px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderTop: '2px solid #000', borderBottom: '2px solid #000' }, children: [_jsx("th", { style: { padding: '8px', textAlign: 'left', fontWeight: 'bold' }, children: t.description }), _jsx("th", { style: { padding: '8px', textAlign: 'center', fontWeight: 'bold' }, children: t.unitPrice }), _jsx("th", { style: { padding: '8px', textAlign: 'center', fontWeight: 'bold' }, children: t.quantity }), _jsx("th", { style: { padding: '8px', textAlign: 'right', fontWeight: 'bold' }, children: t.amount })] }) }), _jsxs("tbody", { children: [safeLineItems.map((item, idx) => {
                                    const itemAmount = item.quantity * item.unitPrice;
                                    return (_jsxs("tr", { style: { borderBottom: '1px solid #000' }, children: [_jsx("td", { style: { padding: '8px', textAlign: 'left' }, children: item.description }), _jsx("td", { style: { padding: '8px', textAlign: 'center' }, children: item.unitPrice.toFixed(2) }), _jsx("td", { style: { padding: '8px', textAlign: 'center' }, children: item.quantity }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: itemAmount.toFixed(2) })] }, idx));
                                }), safeLineItems.length === 0 && (_jsx("tr", { style: { borderBottom: '1px solid #000' }, children: _jsx("td", { colSpan: 4, style: { padding: '8px', textAlign: 'center' }, children: "-" }) }))] })] }) }), _jsx("div", { style: { marginBottom: '20px' }, children: _jsx("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '10px' }, children: _jsxs("tbody", { children: [_jsxs("tr", { style: { borderTop: '2px solid #000', borderBottom: '2px solid #000' }, children: [_jsx("td", { style: { padding: '8px', textAlign: 'left', fontWeight: 'bold' }, children: t.totalHT }), _jsx("td", { style: { padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }, children: safeSubtotal.toFixed(2) })] }), _jsxs("tr", { style: { borderBottom: '2px solid #000' }, children: [_jsxs("td", { style: { padding: '8px', textAlign: 'left', fontWeight: 'bold' }, children: [t.tax, " ", getTaxPercentage(), "%"] }), _jsx("td", { style: { padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }, children: safeTaxAmount.toFixed(2) })] }), safeStampFee > 0 && (_jsxs("tr", { style: { borderBottom: '2px solid #000' }, children: [_jsx("td", { style: { padding: '8px', textAlign: 'left', fontWeight: 'bold' }, children: t.stamp }), _jsx("td", { style: { padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }, children: safeStampFee.toFixed(2) })] })), _jsxs("tr", { children: [_jsx("td", { style: { padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px' }, children: t.totalTTC }), _jsx("td", { style: { padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c', fontSize: '11px' }, children: (safeTotal + safeStampFee).toFixed(2) })] })] }) }) }), (invoice.notes || invoice.terms) && (_jsxs("div", { style: { marginBottom: '20px' }, children: [invoice.notes && (_jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("p", { style: { margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold' }, children: t.notes }), _jsx("p", { style: { margin: '0', fontSize: '9px', whiteSpace: 'pre-wrap' }, children: invoice.notes })] })), invoice.terms && (_jsxs("div", { children: [_jsx("p", { style: { margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold' }, children: "Terms" }), _jsx("p", { style: { margin: '0', fontSize: '9px', whiteSpace: 'pre-wrap' }, children: invoice.terms })] }))] })), _jsx("div", { style: { borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'center', fontSize: '8px', color: '#666' }, children: _jsx("p", { style: { margin: '0' }, children: footerText }) })] }));
};
export default InvoiceTemplate;

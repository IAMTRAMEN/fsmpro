import { Invoice, Customer, WorkOrder, InvoiceSettings } from '../types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  customer?: Customer;
  workOrder?: WorkOrder;
  settings?: InvoiceSettings | null;
}

const translations: { [key: string]: { [key: string]: string } } = {
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

const InvoiceTemplate = ({ 
  invoice, 
  customer,
  workOrder,
  settings
}: InvoiceTemplateProps) => {
  const language = (settings?.language || 'en') as string;
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
  const safeStampFee = Number((invoice as any).stampFee || 0);
  const safeLineItems = invoice.lineItems || [];

  const calculateTaxByRate = (lineItems: any[]) => {
    const taxes: { [key: number]: number } = {};
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
    if (rates.length > 0) return rates[0];
    return safeLineItems.length > 0 ? safeLineItems[0].taxRate : 0;
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      lineHeight: '1.4',
      padding: '20px',
      backgroundColor: '#ffffff',
      maxWidth: '900px',
      overflow: 'auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '60%' }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#146bdcff', fontWeight: 'bold' }}>
                  Ste {companyName}
                </h1>
                <p style={{ margin: '3px 0', fontSize: '11px', color: '#146bdcff', fontWeight: 'bold' }}>
                  {companyAddress}
                </p>
                <p style={{ margin: '3px 0', fontSize: '11px', color: '#000' }}>
                  {companyTax && `${t.fiscalNumber}: ${companyTax}`}
                </p>
              </td>
              <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'top', fontSize: '11px' }}>
                {companyPhone && <p style={{ margin: '0' }}>Tél : {companyPhone}</p>}
                {companyEmail && <p style={{ margin: '3px 0 0 0' }}>e-mail : {companyEmail}</p>}
                {settings?.companyWebsite && <p style={{ margin: '3px 0 0 0' }}>Site : {settings.companyWebsite}</p>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <div style={{ border: '2px solid #000', padding: '10px', marginBottom: '10px' }}>
            <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>Date</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#000000ff', fontWeight: 'bold' }}>
              {new Date(invoice.issueDate).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </p>
          </div>
          <div style={{ border: '2px solid #000', padding: '10px' }}>
            <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>Facture</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#146bdcff', fontWeight: 'bold' }}>
              {invoice.id}
            </p>
          </div>
        </div>
        <div style={{ border: '2px solid #000', padding: '10px' }}>
          <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>{t.client}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', fontWeight: 'bold' }}>
            {customer?.name || 'Customer Name'}
          </p>
          <p style={{ margin: '3px 0', fontSize: '10px' }}>
            {customer?.location?.address || 'Address'}
          </p>
          {customer && (customer as any).fiscalNumber && (
            <p style={{ margin: '3px 0', fontSize: '10px' }}>
              {t.fiscalNumber}: {(customer as any).fiscalNumber}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{t.description}</th>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{t.unitPrice}</th>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{t.quantity}</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {safeLineItems.map((item, idx) => {
              const itemAmount = item.quantity * item.unitPrice;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #000' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>{item.description}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{itemAmount.toFixed(2)}</td>
                </tr>
              );
            })}
            {safeLineItems.length === 0 && (
              <tr style={{ borderBottom: '1px solid #000' }}>
                <td colSpan={4} style={{ padding: '8px', textAlign: 'center' }}>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <tbody>
            <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
              <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{t.totalHT}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }}>
                {safeSubtotal.toFixed(2)}
              </td>
            </tr>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>
                {t.tax} {getTaxPercentage()}%
              </td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }}>
                {safeTaxAmount.toFixed(2)}
              </td>
            </tr>
            {safeStampFee > 0 && (
              <tr style={{ borderBottom: '2px solid #000' }}>
                <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{t.stamp}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c' }}>
                  {safeStampFee.toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px' }}>
                {t.totalTTC}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#dc143c', fontSize: '11px' }}>
                {(safeTotal + safeStampFee).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {(invoice.notes || (invoice as any).terms) && (
        <div style={{ marginBottom: '20px' }}>
          {invoice.notes && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold' }}>{t.notes}</p>
              <p style={{ margin: '0', fontSize: '9px', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
            </div>
          )}
          {(invoice as any).terms && (
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold' }}>Terms</p>
              <p style={{ margin: '0', fontSize: '9px', whiteSpace: 'pre-wrap' }}>{(invoice as any).terms}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'center', fontSize: '8px', color: '#666' }}>
        <p style={{ margin: '0' }}>{footerText}</p>
      </div>
    </div>
  );
};

export default InvoiceTemplate;

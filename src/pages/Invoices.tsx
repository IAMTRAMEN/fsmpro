import { useState, useRef, useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { FileText, Trash2, Edit3, Plus, Download, Eye, X, Minus, ChevronDown, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Modal from '../components/Modal';
import InvoiceTemplate from '../components/InvoiceTemplate';

const Invoices = () => {
  const { currentUser, invoices, workOrders, customers, invoiceSettings, fetchInvoiceSettings, fetchInvoices, addInvoice, updateInvoice, deleteInvoice } = useFSMStore();
  
  useEffect(() => {
    fetchInvoiceSettings();
    fetchInvoices();
  }, []);

  // Handle click outside to close all menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isMenuButton = target.closest('[data-menu-button]');
      const isMenu = target.closest('[id^="mobile-menu-"], [id^="menu-"]');

      // If clicking outside both menu buttons and menus, close all menus
      if (!isMenuButton && !isMenu) {
        document.querySelectorAll('[id^="mobile-menu-"], [id^="menu-"]').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const previewRef = useRef<HTMLDivElement>(null);

  const isManager = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');
  const isTechnician = currentUser?.role === 'Technician';

  let filteredInvoices = invoices;
  if (isTechnician && currentUser?.id) {
    const myWorkOrderIds = workOrders
      .filter(wo => wo.technicianIds.includes(currentUser.id))
      .map(wo => wo.id);
    filteredInvoices = invoices.filter(inv => myWorkOrderIds.includes(inv.workOrderId));
  }

  filteredInvoices = filteredInvoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const calculatePaymentStatus = (invoice: any) => {
    if (invoice.status === 'Paid') return 'Paid';
    const paid = Number(invoice.amount || 0) - Number(invoice.total || invoice.amount || 0);
    if (paid > 0 && paid < Number(invoice.total || invoice.amount || 0)) return 'Partially paid';
    return 'Unpaid';
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total || inv.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    if (inv.status === 'Paid') return sum + Number(inv.total || inv.amount || 0);
    return sum;
  }, 0);
  const totalDue = totalAmount - totalPaid;

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = items.reduce((sum, item) => {
      const itemTax = (item.quantity * item.unitPrice * item.taxRate) / 100;
      return sum + itemTax;
    }, 0);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      id: `item${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0
    }]);
  };

  const handleUpdateLineItem = (idx: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[idx][field] = value;
    setLineItems(updated);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleAddInvoice = async () => {
    if (!formData.workOrderId || !formData.customerId || lineItems.length === 0) {
      alert('Please fill in all required fields and add at least one line item');
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals(lineItems);

    const newInvoice = {
      workOrderId: formData.workOrderId,
      customerId: formData.customerId,
      lineItems: lineItems.map((item, idx) => ({
        ...item,
        id: item.id || `item${idx}`
      })),
      subtotal,
      taxAmount,
      total,
      status: formData.status || 'Pending',
      issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: formData.notes || '',
      terms: formData.terms || '',
      discount: discount || 0,
      discountType: discountType || 'amount'
    };

    await addInvoice(newInvoice as any);
    setFormData({});
    setLineItems([]);
    setDiscount(0);
    setDiscountType('amount');
    setIsAddModalOpen(false);
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;

    const { subtotal, taxAmount, total } = calculateTotals(lineItems);

    await updateInvoice(selectedInvoice.id, {
      lineItems,
      subtotal,
      taxAmount,
      total,
      status: formData.status,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      notes: formData.notes,
      terms: formData.terms,
      discount,
      discountType,
    });

    setFormData({});
    setLineItems([]);
    setSelectedInvoice(null);
    setDiscount(0);
    setDiscountType('amount');
    setIsEditModalOpen(false);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice #', 'Status', 'Client', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Amount Due'];
    const rows = filteredInvoices.map(invoice => {
      const customer = customers.find(c => c.id === invoice.customerId);
      const total = Number(invoice.total || invoice.amount || 0);
      const paid = invoice.status === 'Paid' ? total : 0;
      const amountDue = total - paid;
      return [
        invoice.id,
        calculatePaymentStatus(invoice),
        customer?.name || '-',
        invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-',
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-',
        total.toFixed(2),
        paid.toFixed(2),
        amountDue.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePDF = async (invoice: any) => {
    try {
      const customer = customers.find(c => c.id === invoice.customerId);
      const language = invoiceSettings?.language || 'en';
      
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
          tax: 'Tax',
          totalDue: 'Total Due',
          notes: 'Notes'
        },
        fr: {
          invoice: 'FACTURE',
          billFrom: 'FACTURER PAR',
          billTo: 'FACTURER À',
          invoiceDate: 'Date de facture',
          dueDate: 'Date d\'échéance',
          status: 'Statut',
          description: 'Description',
          quantity: 'Quantité',
          unitPrice: 'Prix unitaire',
          taxPercent: 'Taxe %',
          amount: 'Montant',
          taxSummary: 'Résumé des taxes',
          totalTax: 'Total des taxes',
          totals: 'Totaux',
          subtotal: 'Sous-total',
          tax: 'Taxe',
          totalDue: 'Total dû',
          notes: 'Remarques'
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
          tax: 'Impuesto',
          totalDue: 'Total adeudado',
          notes: 'Notas'
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
          tax: 'Steuern',
          totalDue: 'Gesamtfällig',
          notes: 'Notizen'
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
          tax: 'Imposta',
          totalDue: 'Totale dovuto',
          notes: 'Note'
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
          tax: 'Imposto',
          totalDue: 'Total devido',
          notes: 'Notas'
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
          tax: 'الضريبة',
          totalDue: 'المبلغ المستحق',
          notes: 'ملاحظات'
        }
      };
      
      const t = translations[language] || translations['en'];
      const companyName = invoiceSettings?.companyName || 'Smart FSM';
      const companyTax = invoiceSettings?.companyTax || 'MF: 1234567890/K';
      const companyAddress = invoiceSettings?.companyAddress || 'Your Company Address';
      const companyPhone = invoiceSettings?.companyPhone || '';
      const companyEmail = invoiceSettings?.companyEmail || '';
      const logoUrl = invoiceSettings?.logoUrl;
      const footerText = invoiceSettings?.footerText || 'Thank you for your business!';
      
      const safeLineItems = invoice.lineItems || [];
      const safeSubtotal = Number(invoice.subtotal || 0);
      const safeTaxAmount = Number(invoice.taxAmount || 0);
      const safeTotal = Number(invoice.total || 0);
      
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
      
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '900px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.color = '#333';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      
      tempContainer.innerHTML = `
        <div style="border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="width: 70%;">
                  <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 100px; max-height: 60px; object-fit: contain;" />` : ''}
                    <div>
                      <h1 style="margin: 0 0 5px 0; font-size: 28px; color: #0066cc;">${companyName}</h1>
                      <p style="margin: 5px 0; font-size: 12px; color: #666;">${companyTax}</p>
                    </div>
                  </div>
                  <p style="margin: 5px 0; font-size: 12px; color: #666;">${companyAddress}</p>
                  ${companyPhone || companyEmail ? `<p style="margin: 5px 0; font-size: 12px; color: #666;">${companyPhone} ${companyPhone && companyEmail ? '|' : ''} ${companyEmail}</p>` : ''}
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 12px; font-weight: bold;">
                    <p style="margin: 0 0 5px 0;">${t.invoice}</p>
                    <p style="margin: 0 0 5px 0; font-size: 16px; color: #0066cc;">${invoice.id}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="width: 50%; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #0066cc;">${t.billFrom}</h3>
                  <p style="margin: 5px 0; font-size: 12px; font-weight: bold;">${companyName}</p>
                  <p style="margin: 5px 0; font-size: 11px;">${companyTax}</p>
                  <p style="margin: 5px 0; font-size: 11px;">${companyAddress}</p>
                </td>
                <td style="width: 50%; padding-left: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #0066cc;">${t.billTo}</h3>
                  <p style="margin: 5px 0; font-size: 12px; font-weight: bold;">${customer?.name || 'Customer Name'}</p>
                  <p style="margin: 5px 0; font-size: 11px;">${customer?.email || 'email@example.com'}</p>
                  <p style="margin: 5px 0; font-size: 11px;">${customer?.phone || 'Phone'}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="width: 30%;">
                  <p style="margin: 0 0 5px 0; font-weight: bold;">${t.invoiceDate}</p>
                  <p style="margin: 0;">${new Date(invoice.issueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </td>
                <td style="width: 35%;">
                  <p style="margin: 0 0 5px 0; font-weight: bold;">${t.dueDate}</p>
                  <p style="margin: 0;">${new Date(invoice.dueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </td>
                <td style="width: 35%;">
                  <p style="margin: 0 0 5px 0; font-weight: bold;">${t.status}</p>
                  <p style="margin: 0; color: ${invoice.status === 'Paid' ? '#28a745' : invoice.status === 'Overdue' ? '#dc3545' : '#ffc107'};">${invoice.status}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 2px solid #0066cc; background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; font-weight: bold;">${t.description}</th>
                <th style="padding: 10px; text-align: center; font-weight: bold;">${t.quantity}</th>
                <th style="padding: 10px; text-align: right; font-weight: bold;">${t.unitPrice}</th>
                <th style="padding: 10px; text-align: right; font-weight: bold;">${t.taxPercent}</th>
                <th style="padding: 10px; text-align: right; font-weight: bold;">${t.amount}</th>
              </tr>
            </thead>
            <tbody>
              ${safeLineItems.map((item: any) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; text-align: left;">${item.description}</td>
                  <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right;">${item.taxRate}%</td>
                  <td style="padding: 10px; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            ${Object.keys(taxesByRate).length > 0 ? `
              <div style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold;">${t.taxSummary}</h4>
                <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                  <tbody>
                    ${Object.entries(taxesByRate).map(([rate, amount]: [string, any]) => `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 5px 0;">${t.tax} @ ${rate}%</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: bold;">$${amount.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr style="font-weight: bold; border-top: 2px solid #0066cc;">
                      <td style="padding: 8px 0;">${t.totalTax}</td>
                      <td style="padding: 8px 0; text-align: right;">$${safeTaxAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>

          <div>
            <div style="border: 2px solid #0066cc; padding: 15px; border-radius: 4px; background-color: #f8f9fa;">
              <h4 style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold;">${t.totals}</h4>
              <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                <tbody>
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0;">${t.subtotal}</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${safeSubtotal.toFixed(2)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0;">${t.tax}</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${safeTaxAmount.toFixed(2)}</td>
                  </tr>
                  <tr style="font-weight: bold; font-size: 12px; border-top: 2px solid #0066cc;">
                    <td style="padding: 10px 0;">${t.totalDue}</td>
                    <td style="padding: 10px 0; text-align: right; color: #0066cc;">$${safeTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <div style="margin-bottom: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold;">${t.notes}</h4>
            <p style="margin: 0; font-size: 10px; white-space: pre-wrap;">${invoice.notes}</p>
          </div>
        ` : ''}

        <div style="border-top: 3px solid #0066cc; padding-top: 20px; text-align: center; font-size: 10px; color: #999;">
          <p style="margin: 0;">${footerText}</p>
          <p style="margin: 5px 0 0 0;">Invoice ${invoice.id} - ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : language)}</p>
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        windowHeight: tempContainer.scrollHeight,
        windowWidth: 900
      });
      
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const aspectRatio = canvas.width / canvas.height;
      const imgWidth = pdfWidth - 10;
      const imgHeight = imgWidth / aspectRatio;
      
      let heightLeft = imgHeight;
      let position = 5;
      
      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 10);
      position = -(imgHeight - pdfHeight + 10);
      
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        position -= pdfHeight;
      }
      
      pdf.save(`invoice-${invoice.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const openEditModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setLineItems(invoice.lineItems || []);
    setFormData({
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
      notes: invoice.notes || '',
      terms: invoice.terms || ''
    });
    setDiscount(parseFloat(invoice.discount || 0));
    setDiscountType((invoice.discountType as 'amount' | 'percent') || 'amount');
    setIsEditModalOpen(true);
  };

  const openPreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            <span className="sm:inline">Export all</span>
          </button>
          {isManager && (
            <button
              onClick={() => {
                setFormData({});
                setLineItems([]);
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:inline">New invoice</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-blue-500 text-white rounded-lg p-4 sm:p-6 md:p-8">
          <p className="text-sm opacity-90">Total amount</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-500 text-white rounded-lg p-4 sm:p-6 md:p-8">
          <p className="text-sm opacity-90">Total paid</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-orange-500 text-white rounded-lg p-4 sm:p-6 md:p-8 sm:col-span-2 lg:col-span-1">
          <p className="text-sm opacity-90">Total due</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">${totalDue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                filterStatus === null
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" /> All
            </button>
            <button
              onClick={() => setFilterStatus('Paid')}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                filterStatus === 'Paid'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                filterStatus === 'Pending'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('Overdue')}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                filterStatus === 'Overdue'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Overdue
            </button>
          </div>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-0 flex-1 sm:flex-none sm:w-64"
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No invoices found</p>
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Invoice #</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Status</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Client</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm hidden lg:table-cell">Issue date</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm hidden xl:table-cell">Due date</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Total</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm hidden lg:table-cell">Paid</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Due</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    const total = Number(invoice.total || invoice.amount || 0);
                    const paid = invoice.status === 'Paid' ? total : 0;
                    const amountDue = total - paid;
                    const paymentStatus = calculatePaymentStatus(invoice);

                    return (
                      <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium">{invoice.id}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                            paymentStatus === 'Paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                            paymentStatus === 'Partially paid' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                            'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-100">{customer?.name || '-'}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">${total.toFixed(2)}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">${paid.toFixed(2)}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">${amountDue.toFixed(2)}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();

                              // Close all other menus first
                              document.querySelectorAll('[id^="menu-"]').forEach(menu => {
                                if (menu.id !== `menu-${invoice.id}`) {
                                  menu.classList.add('hidden');
                                }
                              });

                              const menu = document.getElementById(`menu-${invoice.id}`);
                              if (menu) {
                                if (menu.classList.contains('hidden')) {
                                  // Position the menu relative to the button
                                  menu.style.position = 'fixed';
                                  menu.style.top = `${rect.bottom + 4}px`;
                                  menu.style.left = `${rect.right - menu.offsetWidth}px`;
                                  menu.style.zIndex = '50';
                                  menu.classList.remove('hidden');
                                } else {
                                  menu.classList.add('hidden');
                                }
                              }
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          >
                            ⋮
                          </button>
                          <div id={`menu-${invoice.id}`} className="hidden fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[140px]"
                               style={{
                                 top: 'auto',
                                 left: 'auto',
                                 transform: 'translate(-50%, -100%)',
                                 marginTop: '-8px'
                               }}>
                            <button
                              onClick={() => {
                                openPreview(invoice);
                                document.getElementById(`menu-${invoice.id}`)?.classList.add('hidden');
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                handleGeneratePDF(invoice);
                                document.getElementById(`menu-${invoice.id}`)?.classList.add('hidden');
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Export PDF
                            </button>
                            {isManager && (
                              <>
                                <button
                                  onClick={() => {
                                    openEditModal(invoice);
                                    document.getElementById(`menu-${invoice.id}`)?.classList.add('hidden');
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteInvoice(invoice.id);
                                    document.getElementById(`menu-${invoice.id}`)?.classList.add('hidden');
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 relative">
              {filteredInvoices.map((invoice) => {
                const customer = customers.find(c => c.id === invoice.customerId);
                const total = Number(invoice.total || invoice.amount || 0);
                const paid = invoice.status === 'Paid' ? total : 0;
                const amountDue = total - paid;
                const paymentStatus = calculatePaymentStatus(invoice);

                return (
                  <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{invoice.id}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer?.name || 'No customer'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          paymentStatus === 'Paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                          paymentStatus === 'Partially paid' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                          'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {paymentStatus}
                        </span>
                        <button
                          data-menu-button
                          onClick={(e) => {
                            e.stopPropagation();
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();

                            // Close all other menus first
                            document.querySelectorAll('[id^="mobile-menu-"]').forEach(menu => {
                              if (menu.id !== `mobile-menu-${invoice.id}`) {
                                menu.classList.add('hidden');
                              }
                            });

                            const menu = document.getElementById(`mobile-menu-${invoice.id}`);
                            if (menu) {
                              if (menu.classList.contains('hidden')) {
                                // Position the menu relative to the button
                                menu.style.position = 'fixed';
                                menu.style.top = `${rect.bottom + 4}px`;
                                menu.style.left = `${rect.right - menu.offsetWidth}px`;
                                menu.style.zIndex = '50';
                                menu.classList.remove('hidden');
                              } else {
                                menu.classList.add('hidden');
                              }
                            }
                          }}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Issue Date</p>
                        <p className="font-medium">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                        <p className="font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Total</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">${total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Paid</p>
                          <p className="font-medium text-green-600 dark:text-green-400">${paid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Due</p>
                          <p className="font-medium text-orange-600 dark:text-orange-400">${amountDue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Action Menus - positioned outside cards */}
              {filteredInvoices.map((invoice) => (
                <div
                  key={`menu-${invoice.id}`}
                  id={`mobile-menu-${invoice.id}`}
                  className="hidden fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[140px]"
                  style={{
                    top: 'auto',
                    left: 'auto',
                    transform: 'translate(-50%, -100%)',
                    marginTop: '-8px'
                  }}
                >
                  <button
                    onClick={() => {
                      openPreview(invoice);
                      document.getElementById(`mobile-menu-${invoice.id}`)?.classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      handleGeneratePDF(invoice);
                      document.getElementById(`mobile-menu-${invoice.id}`)?.classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export PDF
                  </button>
                  {isManager && (
                    <>
                      <button
                        onClick={() => {
                          openEditModal(invoice);
                          document.getElementById(`mobile-menu-${invoice.id}`)?.classList.add('hidden');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteInvoice(invoice.id);
                          document.getElementById(`mobile-menu-${invoice.id}`)?.classList.add('hidden');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isManager && (
        <>
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Add New Invoice"
            maxWidth="max-w-6xl xl:max-w-5xl"
          >
            <div className="space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-4 sm:pb-6 border-b">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Customer *</label>
                  <select
                    value={formData.customerId || ''}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Work Order *</label>
                  <select
                    value={formData.workOrderId || ''}
                    onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a work order</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>
                        {wo.title} ({wo.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <select
                    value={formData.status || 'Pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-700">Issue date</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="date"
                      value={formData.issueDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Due date</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="date"
                      value={formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pb-4 sm:pb-6 border-b">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 flex-1 sm:flex-none" disabled>
                    <option>Choose a product</option>
                  </select>
                  <button
                    onClick={handleAddLineItem}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-600 flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" /> Add product
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-gray-600">Products</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-600">Quantity</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Unit price</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Tax</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Total amount</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              placeholder="Product name"
                              value={item.description}
                              onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateLineItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                                className="w-12 text-center px-1 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                              />
                              <button
                                onClick={() => handleUpdateLineItem(idx, 'quantity', item.quantity + 1)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateLineItem(idx, 'unitPrice', Math.max(0, item.unitPrice - 10))}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                              />
                              <button
                                onClick={() => handleUpdateLineItem(idx, 'unitPrice', item.unitPrice + 10)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <select
                              value={item.taxRate}
                              onChange={(e) => handleUpdateLineItem(idx, 'taxRate', parseFloat(e.target.value))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                            >
                              <option value={0}>No Tax</option>
                              <option value={5}>5%</option>
                              <option value={10}>10%</option>
                              <option value={15}>15%</option>
                              <option value={19}>19%</option>
                              <option value={20}>20%</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase">Discount type</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
                        className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="amount">Fixed Amount</option>
                        <option value="percent">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase">Discount</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">Terms</label>
                    <textarea
                      value={formData.terms || ''}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="Payment terms..."
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payment summary</h3>
                  {(() => {
                    const { subtotal, taxAmount, total } = calculateTotals(lineItems);
                    const discountAmount = discountType === 'percent'
                      ? (subtotal * discount) / 100
                      : discount;
                    const finalTotal = subtotal + taxAmount - discountAmount;
                    return (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-2 border-b">
                          <span>Sub total:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-2 border-b">
                          <span>(+) Tax:</span>
                          <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-3 border-b">
                          <span>(-) Discount:</span>
                          <span>${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pb-3 border-b">
                          <span>TOTAL:</span>
                          <span>${finalTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-2">
                          <span>Received amount:</span>
                          <span>0</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-2">
                          <span>Return amount:</span>
                          <span>$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                          <span>Due amount:</span>
                          <span>${finalTotal.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t justify-end">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 sm:flex-none sm:max-w-xs bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInvoice}
                  className="flex-1 sm:flex-none sm:max-w-xs bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Invoice
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Invoice"
            maxWidth="max-w-6xl xl:max-w-5xl"
          >
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {selectedInvoice && (
                <>
                  <div className="mx-8 grid grid-cols-3 gap-6 pb-6 border-b">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Client</label>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">{customers.find(c => c.id === selectedInvoice.customerId)?.name || 'N/A'}</span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Invoice number</label>
                      <input
                        type="text"
                        value={selectedInvoice.id}
                        disabled
                        className="mt-2 w-full px-3 py-2 bg-gray-100 text-sm border border-gray-300 rounded outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                      <select
                        value={formData.status || 'Pending'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  <div className="mx-8 grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Issue date</label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="date"
                          value={formData.issueDate || ''}
                          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Due date</label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="date"
                          value={formData.dueDate || ''}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mx-8 space-y-4 pb-6 border-b">
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" disabled>
                        <option>Choose a product</option>
                      </select>
                      <button
                        onClick={handleAddLineItem}
                        className="bg-green-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-600 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add product
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Products</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-600">Quantity</th>
                            <th className="text-right py-3 px-2 font-medium text-gray-600">Unit price</th>
                            <th className="text-right py-3 px-2 font-medium text-gray-600">Tax</th>
                            <th className="text-right py-3 px-2 font-medium text-gray-600">Total amount</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  placeholder="Product name"
                                  value={item.description}
                                  onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleUpdateLineItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                                    className="w-12 text-center px-1 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                  <button
                                    onClick={() => handleUpdateLineItem(idx, 'quantity', item.quantity + 1)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdateLineItem(idx, 'unitPrice', Math.max(0, item.unitPrice - 10))}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                  <button
                                    onClick={() => handleUpdateLineItem(idx, 'unitPrice', item.unitPrice + 10)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <select
                                  value={item.taxRate}
                                  onChange={(e) => handleUpdateLineItem(idx, 'taxRate', parseFloat(e.target.value))}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                                >
                                  <option value={0}>No Tax</option>
                                  <option value={5}>5%</option>
                                  <option value={10}>10%</option>
                                  <option value={15}>15%</option>
                                  <option value={19}>19%</option>
                                  <option value={20}>20%</option>
                                </select>
                              </td>
                              <td className="py-3 px-2 text-right font-medium">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mx-8 grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase">Discount type</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
                          className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="amount">Fixed Amount</option>
                          <option value="percent">Percentage</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase">Discount</label>
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase">Notes</label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={3}
                          placeholder="Additional notes..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase">Terms</label>
                        <textarea
                          value={formData.terms || ''}
                          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                          className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={3}
                          placeholder="Payment terms..."
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg h-fit space-y-3">
                      <h3 className="font-semibold text-gray-900">Payment summary</h3>
                      {(() => {
                        const { subtotal, taxAmount, total } = calculateTotals(lineItems);
                        const discountAmount = discountType === 'percent' 
                          ? (subtotal * discount) / 100 
                          : discount;
                        const finalTotal = subtotal + taxAmount - discountAmount;
                        return (
                          <>
                            <div className="flex justify-between text-sm text-gray-600 pb-2 border-b">
                              <span>Sub total:</span>
                              <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 pb-2 border-b">
                              <span>(+) Tax:</span>
                              <span>${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 pb-3 border-b">
                              <span>(-) Discount:</span>
                              <span>${discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pb-3 border-b">
                              <span>TOTAL:</span>
                              <span>${finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 pb-2">
                              <span>Received amount:</span>
                              <span>0</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 pb-2">
                              <span>Return amount:</span>
                              <span>$0.00</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 font-medium">
                              <span>Due amount:</span>
                              <span>${finalTotal.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t justify-end">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 sm:flex-none sm:max-w-xs bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditInvoice}
                      className="flex-1 sm:flex-none sm:max-w-xs bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Save Changes
                    </button>
              </div>
          </Modal>
        </>
      )}

      {isPreviewOpen && selectedInvoice && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Invoice Preview - ${selectedInvoice.id}`}
          maxWidth="max-w-5xl xl:max-w-4xl"
        >
         <div ref={previewRef} className="bg-white overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)', minWidth: '900px' }}>
            <InvoiceTemplate
              invoice={isEditModalOpen ? {
                ...selectedInvoice,
                lineItems,
                issueDate: formData.issueDate || selectedInvoice.issueDate,
                dueDate: formData.dueDate || selectedInvoice.dueDate,
                notes: formData.notes !== undefined ? formData.notes : selectedInvoice.notes,
                terms: formData.terms !== undefined ? formData.terms : selectedInvoice.terms,
                status: formData.status || selectedInvoice.status,
                discount: discount,
                discountType: discountType as 'amount' | 'percent' | undefined,
                ...calculateTotals(lineItems)
              } : selectedInvoice}
              customer={customers.find(c => c.id === selectedInvoice.customerId)}
              workOrder={workOrders.find(wo => wo.id === selectedInvoice.workOrderId)}
              settings={invoiceSettings}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t">
            <button
              onClick={() => handleGeneratePDF(selectedInvoice)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="sm:inline">Download PDF</span>
            </button>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Invoices;

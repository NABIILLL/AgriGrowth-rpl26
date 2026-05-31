import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
const doc = new jsPDF();
const res = autoTable(doc, { head: [['A']], body: [['B']] });
console.log('Returned value keys:', Object.keys(res || {}));
console.log('Does it have finalY?', 'finalY' in (res || {}));

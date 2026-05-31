import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
const doc = new jsPDF();
autoTable(doc, { head: [['A']], body: [] });
console.log(doc.lastAutoTable ? 'exists' : 'undefined');

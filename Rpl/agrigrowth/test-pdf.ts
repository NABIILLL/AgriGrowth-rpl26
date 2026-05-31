import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
const doc = new jsPDF();
autoTable(doc, { head: [['A']], body: [['B']] });
console.log(doc.lastAutoTable ? 'exists' : 'undefined');
console.log(doc.previousAutoTable ? 'previousAutoTable exists' : 'previousAutoTable undefined');
const anyDoc = doc as any;
console.log(anyDoc.autoTable ? 'autoTable exists on doc' : 'autoTable undefined on doc');

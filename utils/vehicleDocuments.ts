import axios from 'axios';
import * as XLSX from 'xlsx';
import { parseStringPromise } from 'xml2js';
import path from 'path';
import fs from 'fs';

interface VehicleDocument {
  vehicleNumber: string;
  insuranceExpiry: string;
  permitExpiry: string;
  pucExpiry: string;
  dlExpiry: string;
  fitnessExpiry: string;
  taxExpiry: string;
  lastUpdated: string;
}

const EXCEL_FILE_PATH = path.join(process.cwd(), 'data', 'vehicle_documents.xlsx');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

export async function fetchVehicleDocuments(vehicleNumber: string): Promise<VehicleDocument | null> {
  try {
    const response = await axios.post('https://scmapml.com/verify/vahan', {
      vehiclenumber: vehicleNumber
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.code === '200' && response.data.response?.[0]?.response) {
      const xmlData = response.data.response[0].response;
      const result = await parseStringPromise(xmlData);
      const details = result.VehicleDetails;

      return {
        vehicleNumber,
        insuranceExpiry: details.rc_insurance_upto?.[0] || '',
        permitExpiry: details.rc_np_upto?.[0] || '',
        pucExpiry: details.rc_pucc_upto?.[0] || '',
        dlExpiry: '', // Not available in the API response
        fitnessExpiry: details.rc_fit_upto?.[0] || '',
        taxExpiry: details.rc_tax_upto?.[0] || '',
        lastUpdated: new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching documents for ${vehicleNumber}:`, error);
    return null;
  }
}

export function saveToExcel(documents: VehicleDocument[]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(documents);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Documents');
  XLSX.writeFile(workbook, EXCEL_FILE_PATH);
}

export function readFromExcel(): VehicleDocument[] {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      return [];
    }
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets['Vehicle Documents'];
    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

export function getDocumentStatus(expiryDate: string): 'valid' | 'expiring' | 'expired' {
  if (!expiryDate) return 'valid';
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(today.getDate() + 10);

  if (expiry < today) return 'expired';
  if (expiry <= tenDaysFromNow) return 'expiring';
  return 'valid';
}

export async function updateVehicleDocuments(vehicleNumbers: string[]) {
  const documents: VehicleDocument[] = [];
  
  for (const vehicleNumber of vehicleNumbers) {
    const doc = await fetchVehicleDocuments(vehicleNumber);
    if (doc) {
      documents.push(doc);
    }
  }

  if (documents.length > 0) {
    saveToExcel(documents);
  }
} 
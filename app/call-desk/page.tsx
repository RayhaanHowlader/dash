'use client';

import React, { useEffect, useState } from 'react';
import Loading from '../loading';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import { IBM_Plex_Sans, Montserrat } from 'next/font/google';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});

interface Ticket {
  ticketId: string;
  issueType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  ticket: {
    createdBy: {
      name: string;
      phone: number;
      _id: string;
      role: string;
    };
    assignee: {
      name: string;
      role: string;
    };
    dueDate: string;
    vehicle_status: string;
    problemIs: string;
    problems: string;
    workPlace: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Helper to format time difference
function formatTimeUp(createdAt: string, now: Date) {
  const created = new Date(createdAt);
  let diff = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 1000));
  const days = Math.floor(diff / (24 * 3600));
  diff %= 24 * 3600;
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  
  // Format with leading zeros
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  return days > 0 
    ? `${days}d ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s` 
    : `${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`;
}

// Helper to format date in Indian format
function formatIndianDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Helper to check if time is up
function isTimeUp(dueDate: string) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return now > due;
}

// Helper to check if ticket is unattended
function isUnattended(ticket: Ticket) {
  const status = (ticket.ticket?.currentStatus || '').toLowerCase();
  return !status || status === 'unattend' || status === 'unattented' || status === 'open';
}

// Helper to get emoji for currentStatus
function getStatusEmoji(status: string) {
  if (!status) return '❓';
  switch (status) {
    case 'open':
    case 'UNATTENTED':
      return '🔴';
    case 'complete':
      return '✅';
    case 'WP':
      return '⚙️🔧';
    case 'WAIT FOR APPROVAL':
      return '✋';
    case 'PAYMENT PENDING':
      return '💲';
    case 'ONWAY DOCUMENTATION PENDING':
      return '🟢';
    case 'ONWAY PAYMENT PENDING':
      return '🟢💲';
    default:
      return '❓';
  }
}

// Helper to check if ticket is accident
function isAccident(problemIs: string | undefined) {
  if (!problemIs) return false;
  const val = problemIs.trim().toLowerCase();
  return val.includes('accident') || val.includes('एक्सीडेंट');
}

// Define the filtering function outside the component
const getTicketsForCategoryAndVehicleType = (
  allTickets: Ticket[],
  categoryKey: string, 
  vehicleType: 'Loaded' | 'Empty'
): Ticket[] => {
  // First filter by vehicle type
  const ticketsToFilter = allTickets.filter(ticket =>
    vehicleType === 'Loaded'
      ? (ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle')
      : (ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle')
  );

  // Define the list of specific workshop categories
  const specificWorkshops = ['Workshop-(Eicher)', 'Workshop-(Tata)', 'Workshop-(Ashok leyland)', 'Apml Workshop-PALWAL'];

  return ticketsToFilter.filter((ticket: Ticket) => {
    const workPlace = ticket.ticket?.workPlace;
    const problemIs = ticket.ticket?.problemIs?.trim() || 'Other Issue/अन्य मुद्दे';

    // Explicitly check for specific workshop categories
    if (specificWorkshops.includes(categoryKey)) {
      return workPlace === categoryKey;
    } else if (workPlace === 'Local' && ['Accident/एक्सीडेंट', 'Other Issue/अन्य मुद्दे', 'Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(categoryKey)) {
      // Include Local tickets in the general categories based on problemIs
      if (categoryKey === 'Accident/एक्सीडेंट') {
          return isAccident(problemIs);
      } else if (categoryKey === 'Other Issue/अन्य मुद्दे') {
          return !isAccident(problemIs) && !['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(problemIs);
      } else { // Battery, New Tyre, Tyre Puncher
          return problemIs === categoryKey;
      }
    } else if (['Accident/एक्सीडेंट', 'Other Issue/अन्य मुद्दे', 'Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(categoryKey)) {
        // Include non-local, non-workshop tickets in the general categories based on problemIs
        // Ensure tickets assigned to specific workshops are excluded from the general categories
        if (!specificWorkshops.includes(workPlace || '')) {
            if (categoryKey === 'Accident/एक्सीडेंट') {
                return isAccident(problemIs);
            } else if (categoryKey === 'Other Issue/अन्य मुद्दे') {
                return !isAccident(problemIs) && !['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(problemIs);
            } else { // Battery, New Tyre, Tyre Puncher
                return problemIs === categoryKey;
            }
        }
    }

    return false; // Should not reach here for defined categories
  });
};

// Helper for SXL-like loading bar
const LoadingBar = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 right-0 h-1 z-50">
    <div
      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
      style={{
        width: `${progress}%`,
        transition: 'width 0.3s ease-in-out',
        boxShadow: '0 0 10px rgba(78, 84, 200, 0.7)'
      }}
    />
  </div>
);

// Global CSS Styles (combined and enhanced with SXL's glass effects and animations)
const styles = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.2; }
    100% { opacity: 1; }
  }
  .animate-blink {
    animation: blink 1s infinite;
  }
  .animate-blink-latest {
    animation: blink 0.5s infinite;
  }
  .status-dot {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 6px 2px #ef4444aa;
    border: 2px solid #222;
    margin: 0 auto;
    position: relative;
    top: 2px;
    transition: box-shadow 0.2s, background 0.2s;
  }
  .status-dot.complete {
    background: #22c55e;
    box-shadow: 0 0 6px 2px #22c55e55;
  }
  .status-dot.default {
    background: #71717a;
    box-shadow: none;
  }
  .status-dot:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 50%;
    top: -30px;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
    z-index: 10;
    opacity: 0.95;
    pointer-events: none;
  }
  .section-header {
    background: linear-gradient(to right, #23272a, #2d2d2d); /* Keep existing gradient */
    border-bottom: 1px solid #404040;
  }
  .table-container {
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.12);
  }
  table {
    width: 100%; /* Ensure table takes full width of its container */
    border-collapse: separate;
    border-spacing: 0;
    background: #181a20;
  }
  .ticket-row {
    transition: background 0.2s;
    font-size: 1rem;
    min-height: 36px;
    height: 36px;
  }
  .ticket-row td, .ticket-row th {
    vertical-align: middle !important;
    border-right: 1px solid #23272a;
  }
  .ticket-row td:last-child, .ticket-row th:last-child {
    border-right: none;
  }
  .ticket-row:hover {
    background-color: #23272a;
  }
  .description-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
  }
  .description-label {
    display: block;
    width: 100%;
    background: transparent;
    border: none;
    color: #d1d5db;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.2s, border 0.2s;
  }
  .description-label:focus, .description-label:active {
    background: #23232b;
    border: 1.5px solid #2563eb;
    outline: none;
    white-space: normal;
    overflow: auto;
  }
  .description-label:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 50%;
    top: -30px;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: pre-line;
    z-index: 10;
    opacity: 0.95;
    pointer-events: none;
  }
  thead th {
    background: #18181b;
    font-size: 1.08rem;
    font-weight: 700;
    color: #e5e7eb;
    letter-spacing: 0.01em;
    border-bottom: 2px solid #23272a;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  /* SXL-specific styles for glass effect and animations */
  @keyframes blink-bg {
    0%, 100% {
      background-color: rgba(252, 66, 74, 0.4);
      box-shadow: 0 0 15px rgba(252, 66, 74, 0.6);
    }
    50% {
      background-color: rgba(252, 66, 74, 0.2);
      box-shadow: 0 0 5px rgba(252, 66, 74, 0.3);
    }
  }
  .blink-bg {
    animation: blink-bg 1.5s ease-in-out infinite;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(78, 84, 200, 0.4);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(78, 84, 200, 0);
    }
  }

  .btn-glow:hover {
    animation: pulse-glow 1.5s infinite;
  }

  .dashboard-table tr {
    transition: all 0.2s ease;
  }

  .dashboard-table tr:hover {
    transform: translateY(-1px);
  }

  @keyframes subtle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .status-circle-success {
    animation: subtle-pulse 3s infinite;
  }

  .glass-card {
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.25),
      0 5px 15px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .glass-card:hover {
    transform: translateY(-3px);
    box-shadow:
      0 15px 35px rgba(0, 0, 0, 0.3),
      0 8px 20px rgba(0, 0, 0, 0.2);
  }

  .dashboard-table {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .dashboard-table th, .dashboard-table td {
    padding: 0.75rem 1rem; /* Adjust padding for SXL-like tables */
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* Lighter border */
  }

  .dashboard-table thead th {
    background: rgba(45, 45, 60, 0.6); /* Darker header background for glass effect */
    color: #e0e0e0; /* Lighter text color */
    font-size: 0.9rem; /* Slightly smaller font for headers */
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge {
    padding: 0.25em 0.75em;
    border-radius: 9999px; /* Fully rounded */
    font-weight: 600;
    font-size: 0.8em;
  }

  .status-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
  }

  .status-circle-danger {
    background-color: #ef4444; /* red-500 */
    box-shadow: 0 0 8px #ef4444aa;
  }
  .status-circle-warning {
    background-color: #f59e0b; /* yellow-500 */
    box-shadow: 0 0 8px #f59e0baa;
  }
  .status-circle-success {
    background-color: #22c55e; /* green-500 */
    box-shadow: 0 0 8px #22c55eaa;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem; /* Left padding for icon */
    border-radius: 0.5rem;
    color: #e0e0e0;
    transition: all 0.2s ease;
  }
  .search-input:focus {
    border-color: #3b82f6; /* blue-500 */
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    outline: none;
  }
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af; /* gray-400 */
  }
`;

export default function CallDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [descriptionEdits, setDescriptionEdits] = useState<{ [key: string]: string }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [placeFilter, setPlaceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // List of work places for assignment
  const workPlaces = [
    "Apml Workshop-KWS",
    "Local",
    "Apml Workshop-CWK",
    "Workshop-(Eicher)",
    "Workshop-(Tata)",
    "Workshop-(Ashok leyland empty Run)",
    "Apml Workshop-PALWAL"
  ];

  const handleDescriptionChange = (ticketId: string, value: string) => {
    setDescriptionEdits(prev => ({ ...prev, [ticketId]: value }));
  };

  const handleDescriptionFocus = (ticketId: string, ticketDescription: string) => {
    setDescriptionEdits(prev => {
      if (prev[ticketId] === undefined) {
        return { ...prev, [ticketId]: ticketDescription };
      }
      return prev;
    });
  };

  const handleDescriptionBlur = async (ticketId: string, ticketDescription: string) => {
    const newDescription = descriptionEdits[ticketId] ?? ticketDescription;
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
      });
      if (response.ok) {
        setTickets(prevTickets => prevTickets.map(ticket =>
          ticket.ticketId === ticketId
            ? { ...ticket, ticket: { ...ticket.ticket, description: newDescription } }
            : ticket
        ));
      }
    } catch (err) {
      console.error('Failed to update description:', err);
    }
  };

  const fetchTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadProgress(10);

      const response = await fetch('/api/tickets');
      setLoadProgress(30);
      const result = await response.json();

      if (result.status === 'success') {
        const sortedTickets = result.data.sort((a: Ticket, b: Ticket) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTickets(sortedTickets);
        setLoadProgress(100);
      } else {
        setError(result.message || 'Failed to fetch tickets');
      }
    } catch (e: any) {
      setError(e.message);
      console.error('Failed to fetch tickets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const intervalId = setInterval(() => fetchTickets(true), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTicketsByPlace = React.useMemo(() => {
    let filtered = tickets;
    
    // Apply search filter first
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => {
        const ticketId = ticket.ticketId?.toLowerCase() || '';
        const vehicleNumber = ticket.ticket?.vehicleNumber?.toLowerCase() || '';
        return ticketId.includes(query) || vehicleNumber.includes(query);
      });
    }
    
    // Then apply place filter
    if (placeFilter.trim() !== '') {
      filtered = filtered.filter(ticket => {
        const workPlace = ticket.ticket?.workPlace || '';
        return workPlace.toLowerCase().includes(placeFilter.toLowerCase());
      });
    }
    
    return filtered;
  }, [tickets, placeFilter, searchQuery]);

  const loadedTickets = filteredTicketsByPlace.filter(
    ticket =>
      (ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle')
  );

  const emptyTickets = filteredTicketsByPlace.filter(
    ticket =>
      (ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle')
  );

  console.log("Loaded problemIs values:", loadedTickets.map(t => t.ticket?.problemIs));
  console.log("Loaded tickets:", loadedTickets);

  const groupTicketsByWorkPlaceAndProblemIs = (tickets: Ticket[]) => {
    return tickets.reduce((acc, ticket) => {
      const workPlace = ticket.ticket?.workPlace || 'Unassigned';
      const role = ticket.ticket?.createdBy?.role || 'Other';
      let problemIs = ticket.ticket?.problemIs?.trim() || 'Other Issue/अन्य मुद्दे';

      const problemCategories = [
        'TyrePuncher/टायर पंचर',
        'Accident/एक्सीडेंट',
        'New Tyre/टायर की समस्या',
        'Other Issue/अन्य मुद्दे',
        'Battery/बैटरी'
      ];
      const alwaysOther = [
        'Altinator/आल्टरनेटर',
        'Gear/गियर',
        'Clutch/क्लच',
        'Starting Issue/स्टार्ट',
      ];

      if (alwaysOther.includes(problemIs)) {
        problemIs = 'Other Issue/अन्य मुद्दे';
      }
      else if (problemCategories[4].includes(problemIs)) {
        problemIs = 'Battery/बैटरी';
      }
      else if (!problemCategories.includes(problemIs)) {
        problemIs = 'Other Issue/अन्य मुद्दे';
      }

      if (!acc[workPlace]) acc[workPlace] = {};
      if (!acc[workPlace][role]) acc[workPlace][role] = {};
      if (!acc[workPlace][role][problemIs]) acc[workPlace][role][problemIs] = [];
      acc[workPlace][role][problemIs].push(ticket);
      return acc;
    }, {} as Record<string, Record<string, Record<string, Ticket[]>>>);
  };

  const loadedAccidentTickets = loadedTickets.filter(ticket => isAccident(ticket.ticket?.problemIs));
  const loadedGroupedTickets = groupTicketsByWorkPlaceAndProblemIs(loadedTickets.filter(ticket => !isAccident(ticket.ticket?.problemIs)));
  const emptyAccidentTickets = emptyTickets.filter(ticket => isAccident(ticket.ticket?.problemIs));
  const emptyGroupedTickets = groupTicketsByWorkPlaceAndProblemIs(emptyTickets.filter(ticket => !isAccident(ticket.ticket?.problemIs)));

  Object.keys(loadedGroupedTickets).forEach(workPlace => {
    Object.keys(loadedGroupedTickets[workPlace]).forEach(role => {
      Object.keys(loadedGroupedTickets[workPlace][role]).forEach(problemIs => {
        loadedGroupedTickets[workPlace][role][problemIs].sort((a, b) => {
          const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;

          const aUnattended = isUnattended(a);
          const bUnattended = isUnattended(b);
          if (aUnattended && !bUnattended) return -1;
          if (!aUnattended && bUnattended) return 1;
          return 0;
        });
      });
    });
  });

  Object.keys(emptyGroupedTickets).forEach(workPlace => {
    Object.keys(emptyGroupedTickets[workPlace]).forEach(role => {
      Object.keys(emptyGroupedTickets[workPlace][role]).forEach(problemIs => {
        emptyGroupedTickets[workPlace][role][problemIs].sort((a, b) => {
          const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;

          const aUnattended = isUnattended(a);
          const bUnattended = isUnattended(b);
          if (aUnattended && !bUnattended) return -1;
          if (!aUnattended && bUnattended) return 1;
          return 0;
        });
      });
    });
  });

  const openTicketsByRole = tickets.filter(ticket =>
    ['jk_tyre', 'ashok_leyland', 'issue_agent', 'Eicher', 'Driver', 'Apml Workshop-PALWAL'].includes(ticket.ticket?.createdBy?.role || '')
  );

  const getAllProblems = (tickets: Ticket[]) => {
    const problems = new Set<string>();
    tickets.forEach(ticket => {
      if (ticket.ticket?.problems) {
        problems.add(ticket.ticket.problems);
      }
    });
    return Array.from(problems);
  };

  const allProblems = getAllProblems([...tickets]);

  const latestTicketId = tickets.length > 0 ? tickets[0].ticketId : null;

  const handleAssignWorkPlace = async (ticketId: string, workPlace: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workPlace }),
      });
      if (response.ok) {
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.ticketId !== ticketId));
      }
    } catch (err) {
      console.error('Failed to assign work place:', err);
    }
  };

  const assignedWorkshopTickets = tickets.filter(
    ticket => workPlaces.includes(ticket.ticket?.workPlace)
  );

  const localTickets = tickets.filter(
    ticket => ticket.ticket?.workPlace === 'Local'
  );

  const loadedLocalTickets = localTickets.filter(
    ticket => ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle'
  );

  const emptyLocalTickets = localTickets.filter(
    ticket => ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle'
  );

  const filterLocalTicketsByCategory = (localTickets: Ticket[], categoryKey: string) => {
    return localTickets.filter(ticket => {
      const problemIs = ticket.ticket?.problemIs?.trim() || 'Other Issue/अन्य मुद्दे';

      if (categoryKey === 'Accident/एक्सीडेंट') {
        return isAccident(problemIs);
      } else if (categoryKey === 'Other Issue/अन्य मुद्दे') {
        return !isAccident(problemIs) &&
               !['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(problemIs) &&
               !problemIs.startsWith('Workshop-');
      } else if (['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(categoryKey)) {
        return problemIs === categoryKey;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen w-full bg-[var(--bg-primary)] ${ibmPlexSans.variable} ${montserrat.variable}`} style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(78, 84, 200, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(252, 66, 74, 0.15) 0%, transparent 40%),
          var(--bg-primary)
        `
      }}>
        <LoadingBar progress={loadProgress} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loading />
            <p className="text-gray-400 mt-4">Loading ticket data... {loadProgress}%</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen w-full bg-[var(--bg-primary)] ${ibmPlexSans.variable} ${montserrat.variable}`} style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(78, 84, 200, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(252, 66, 74, 0.15) 0%, transparent 40%),
          var(--bg-primary)
        `
      }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-xl text-[var(--danger)]">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[var(--bg-primary)] ${ibmPlexSans.variable} ${montserrat.variable}`} style={{
      background: `
        radial-gradient(circle at 20% 20%, rgba(78, 84, 200, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(252, 66, 74, 0.15) 0%, transparent 40%),
        var(--bg-primary)
      `
    }}>
      {refreshing && <LoadingBar progress={loadProgress} />}
      <style jsx global>{styles}</style>
      <div className="dashboard-container" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
        <header className="header-container" style={{
          background: 'rgba(30, 30, 47, 0.35)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Logo />
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-white tracking-wide">Call Desk Dashboard</h1>
                <p className="text-gray-400 text-sm">Real-time vehicle ticket management system</p>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <span className="text-white font-bold text-2xl">APML CONTROL24 X7</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <div className="search-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search ticket or vehicle number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  style={{
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </div>

              <Button
                variant="secondary"
                onClick={() => fetchTickets(true)}
                disabled={refreshing}
                className="btn-secondary w-full md:w-auto"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>

              {/* <Button
                variant="primary"
                onClick={() => alert('Export functionality not implemented yet for Call Desk.')}
                className="btn-primary btn-glow w-full md:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All Data (CSV)
              </Button> */}
            </div>
          </div>
        </header>

        <div className="relative w-full">
          {/* Scroll buttons */}
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-r-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
            onClick={() => {
              const container = document.querySelector('.content-grid');
              if (container) {
                container.scrollBy({ left: -350, behavior: 'smooth' });
              }
            }}
            style={{
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-l-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
            onClick={() => {
              const container = document.querySelector('.content-grid');
              if (container) {
                container.scrollBy({ left: 350, behavior: 'smooth' });
              }
            }}
            style={{
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="horizontal-scroll-fix">
            <div className="content-grid" style={{
              paddingTop: '10px',
              paddingBottom: '20px',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: '20px',
              overflowX: 'auto',
              overflowY: 'hidden',
              width: 'max-content',
              minWidth: '100%',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              msOverflowStyle: '-ms-autohiding-scrollbar',
              cursor: 'grab'
            }}>
              {/* Loaded Vehicles Section */}
              <div className="flex-shrink-0" style={{ width: '950px', marginRight: '20px' }}>
                <div className="glass-card mb-6 overflow-hidden" style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="glass-header p-4 flex items-center gap-3">
                    <div className="bg-[rgba(255,255,255,0.15)] text-white font-bold h-10 w-10 flex items-center justify-center rounded-full">
                      {loadedTickets.length}
                    </div>
                    <h2 className="text-xl font-bold text-green-500 tracking-wide">Loaded Vehicles</h2>
                  </div>

                  {
                    [
                      { key: 'Other Issue/अन्य मुद्दे', label: 'Incoming issue/Other issue' },
                      { key: 'Accident/एक्सीडेंट', label: 'Accident' },
                      { key: 'Battery/बैटरी', label: 'Battery' },
                      { key: 'Workshop-(Eicher)', label: 'Eicher' },
                      { key: 'Workshop-(Tata)', label: 'Tata' },
                      { key: 'Workshop-(Ashok leyland)', label: 'Ashok Leyland' },
                      { key: 'New Tyre/टायर की समस्या', label: 'Tyre new' },
                      { key: 'TyrePuncher/टायर पंचर', label: 'Tyre Puncher' },
                      { key: 'Apml Workshop-PALWAL', label: 'Apml Workshop-PALWAL' }
                    ].map(({ key: categoryKey, label: categoryLabel }) => {
                      const categoryTickets = getTicketsForCategoryAndVehicleType(filteredTicketsByPlace, categoryKey, 'Loaded');

                      categoryTickets.sort((a: Ticket, b: Ticket) => {
                        const aUnattended = isUnattended(a);
                        const bUnattended = isUnattended(b);
                        if (aUnattended && !bUnattended) return -1;
                        if (!aUnattended && bUnattended) return 1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      });

                      return (
                        <div key={categoryKey} className="mb-6">
                          <div className="p-4 bg-gray-700/30 flex items-center border-b border-gray-600">
                            <h4 className="text-md font-medium text-white mr-3">{categoryLabel}</h4>
                            <span className="text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full">{categoryTickets.length}</span>
                          </div>

                          <div className="table-container glass-card bg-gray-800 rounded-lg border border-gray-700">
                            <table className="dashboard-table" style={{tableLayout: 'fixed'}}>
                              <thead>
                                <tr className="bg-gray-900 text-xs border-b border-gray-700">
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '22%'}}>TICKET NUMBER</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '10%'}}>STATUS</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '17%'}}>VEHICLE NUMBER</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '17%'}}>WORK PLACE</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '18%'}}>DESCRIPTION</th>
                                  <th className="px-4 py-3 " style={{width: '16%'}}>TIME UP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {categoryTickets.length > 0 ? (
                                  categoryTickets.map((ticket: Ticket) => (
                                    <tr key={ticket._id} className={`ticket-row text-xs${(ticket.ticketId === latestTicketId) ? ' bg-blue-900/30' : ''}`}>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium">{ticket.ticketId}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center" style={{whiteSpace: 'nowrap'}}>
                                        <span
                                          className={
                                            isUnattended(ticket)
                                              ? 'animate-blink'
                                              : ticket.ticketId === latestTicketId
                                                ? 'animate-blink-latest'
                                                : ''
                                          }
                                          data-tooltip={ticket.ticket?.currentStatus || ticket.status}
                                          style={{ fontSize: '1.3rem', display: 'inline-block' }}
                                        >
                                          {getStatusEmoji(ticket.ticket?.currentStatus || ticket.status)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        {ticket.ticket?.vehicleNumber || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        {ticket.ticket?.workPlace || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-300 description-cell">
                                        <span
                                          className="description-label"
                                          tabIndex={0}
                                          data-tooltip={descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                          title={descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                        >
                                          {descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-mono time-up" style={{whiteSpace: 'nowrap'}}>{formatTimeUp(ticket.createdAt, now)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-400">
                                      No tickets in this category for loaded vehicles
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  }

                </div>
              </div>

              {/* Empty Vehicles Section */}
              <div className="flex-shrink-0" style={{ width: '950px', marginRight: '20px' }}>
                <div className="glass-card mb-6 overflow-hidden" style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="glass-header p-4 flex items-center gap-3">
                    <div className="bg-[rgba(255,255,255,0.15)] text-white font-bold h-10 w-10 flex items-center justify-center rounded-full">
                      {emptyTickets.length}
                    </div>
                    <h2 className="text-xl font-bold text-green-500 tracking-wide">Empty Vehicles</h2>
                  </div>

                  {
                    [
                      { key: 'Other Issue/अन्य मुद्दे', label: 'Incoming issue/Other issue' },
                      { key: 'Accident/एक्सीडेंट', label: 'Accident' },
                      { key: 'Battery/बैटरी', label: 'Battery' },
                      { key: 'Workshop-(Eicher)', label: 'Eicher' },
                      { key: 'Workshop-(Tata)', label: 'Tata' },
                      { key: 'Workshop-(Ashok leyland)', label: 'Ashok Leyland' },
                      { key: 'New Tyre/टायर की समस्या', label: 'Tyre new' },
                      { key: 'TyrePuncher/टायर पंचर', label: 'Tyre Puncher' },
                      { key: 'Apml Workshop-PALWAL', label: 'Apml Workshop-PALWAL' }
                    ].map(({ key: categoryKey, label: categoryLabel }) => {
                      const categoryTickets = getTicketsForCategoryAndVehicleType(filteredTicketsByPlace, categoryKey, 'Empty');

                      categoryTickets.sort((a: Ticket, b: Ticket) => {
                        const aUnattended = isUnattended(a);
                        const bUnattended = isUnattended(b);
                        if (aUnattended && !bUnattended) return -1;
                        if (!aUnattended && bUnattended) return 1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      });

                      return (
                        <div key={categoryKey} className="mb-6">
                          <div className="p-4 bg-gray-700/30 flex items-center border-b border-gray-600">
                            <h4 className="text-md font-medium text-white mr-3">{categoryLabel}</h4>
                            <span className="text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full">{categoryTickets.length}</span>
                          </div>

                          <div className="table-container glass-card bg-gray-800 rounded-lg border border-gray-700">
                            <table className="dashboard-table" style={{tableLayout: 'fixed'}}>
                              <thead>
                                <tr className="bg-gray-900 text-xs border-b border-gray-700">
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '22%'}}>TICKET NUMBER</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '10%'}}>STATUS</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '17%'}}>VEHICLE NUMBER</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '17%'}}>WORK PLACE</th>
                                  <th className="px-4 py-3 text-left text-gray-300 font-medium" style={{width: '18%'}}>DESCRIPTION</th>
                                  <th className="px-4 py-3 " style={{width: '16%'}}>TIME UP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {categoryTickets.length > 0 ? (
                                  categoryTickets.map((ticket: Ticket) => (
                                    <tr key={ticket._id} className={`ticket-row text-xs${(ticket.ticketId === latestTicketId) ? ' bg-blue-900/30' : ''}`}>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium">{ticket.ticketId}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center" style={{whiteSpace: 'nowrap'}}>
                                        <span
                                          className={
                                            isUnattended(ticket)
                                              ? 'animate-blink'
                                              : ticket.ticketId === latestTicketId
                                                ? 'animate-blink-latest'
                                                : ''
                                          }
                                          data-tooltip={ticket.ticket?.currentStatus || ticket.status}
                                          style={{ fontSize: '1.3rem', display: 'inline-block' }}
                                        >
                                          {getStatusEmoji(ticket.ticket?.currentStatus || ticket.status)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        {ticket.ticket?.vehicleNumber || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-300" style={{whiteSpace: 'nowrap'}}>
                                        {ticket.ticket?.workPlace || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-300 description-cell">
                                        <span
                                          className="description-label"
                                          tabIndex={0}
                                          data-tooltip={descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                          title={descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                        >
                                          {descriptionEdits[ticket.ticketId] ?? (ticket.ticket?.description === '-' ? 'Case not attend yet ❌' : (ticket.ticket?.description || '-'))}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-mono time-up" style={{whiteSpace: 'nowrap'}}>{formatTimeUp(ticket.createdAt, now)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-400">
                                      No tickets in this category for empty vehicles
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  }

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
// import Sidebar from '../../components/Sidebar';
import Loading from '../loading';
import Logo from '../../components/Logo';

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
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
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

// Add this CSS animation at the top of the file, after the imports
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
    background: linear-gradient(to right, #23272a, #2d2d2d);
    border-bottom: 1px solid #404040;
  }
  .table-container {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.12);
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
    max-width: 110px;
    min-width: 90px;
    width: 110px;
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
`;

export default function CallDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [descriptionEdits, setDescriptionEdits] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tickets');
        const result = await response.json();

        if (result.status === 'success') {
          // Sort tickets by creation date, newest first
          const sortedTickets = result.data.sort((a: Ticket, b: Ticket) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTickets(sortedTickets);
        }
      } catch (err) {
        setError('Failed to fetch tickets');
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Add auto-refresh every 1 minute using setTimeout and setInterval
  useEffect(() => {
    const refreshPage = () => {
      window.location.reload();
    };

    // Initial timeout for first refresh
    const timeoutId = setTimeout(refreshPage, 60 * 2000);

    // Set up interval for subsequent refreshes
    const intervalId = setInterval(refreshPage, 60 * 2000);

    // Cleanup both timeout and interval
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Filter open tickets for loaded and empty vehicles
  const loadedTickets = tickets.filter(
    ticket =>
      (ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle')
  );

  const emptyTickets = tickets.filter(
    ticket =>
      (ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle')
  );

  console.log("Loaded problemIs values:", loadedTickets.map(t => t.ticket?.problemIs));
  console.log("Loaded tickets:", loadedTickets);

  // Group tickets by workPlace, role and problemIs
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

  // Group by workPlace, role and problemIs
  const isAccident = (problemIs: string | undefined) => {
    if (!problemIs) return false;
    const val = problemIs.trim().toLowerCase();
    return val.includes('accident') || val.includes('एक्सीडेंट');
  };
  const loadedAccidentTickets = loadedTickets.filter(ticket => isAccident(ticket.ticket?.problemIs));
  const loadedGroupedTickets = groupTicketsByWorkPlaceAndProblemIs(loadedTickets.filter(ticket => !isAccident(ticket.ticket?.problemIs)));
  const emptyAccidentTickets = emptyTickets.filter(ticket => isAccident(ticket.ticket?.problemIs));
  const emptyGroupedTickets = groupTicketsByWorkPlaceAndProblemIs(emptyTickets.filter(ticket => !isAccident(ticket.ticket?.problemIs)));

  // After grouping tickets, sort them in each group
  Object.keys(loadedGroupedTickets).forEach(workPlace => {
    Object.keys(loadedGroupedTickets[workPlace]).forEach(role => {
      Object.keys(loadedGroupedTickets[workPlace][role]).forEach(problemIs => {
        loadedGroupedTickets[workPlace][role][problemIs].sort((a, b) => {
          // First sort by creation date (newest first)
          const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;

          // Then sort by unattended status
          const aUnattended = isUnattended(a);
          const bUnattended = isUnattended(b);
          if (aUnattended && !bUnattended) return -1;
          if (!aUnattended && bUnattended) return 1;
          return 0;
        });
      });
    });
  });

  // Do the same for emptyGroupedTickets
  Object.keys(emptyGroupedTickets).forEach(workPlace => {
    Object.keys(emptyGroupedTickets[workPlace]).forEach(role => {
      Object.keys(emptyGroupedTickets[workPlace][role]).forEach(problemIs => {
        emptyGroupedTickets[workPlace][role][problemIs].sort((a, b) => {
          // First sort by creation date (newest first)
          const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;

          // Then sort by unattended status
          const aUnattended = isUnattended(a);
          const bUnattended = isUnattended(b);
          if (aUnattended && !bUnattended) return -1;
          if (!aUnattended && bUnattended) return 1;
          return 0;
        });
      });
    });
  });

  // Get all open tickets
  const openTicketsByRole = tickets.filter(ticket =>
    ['jk_tyre', 'ashok_leyland', 'issue_agent', 'Eicher', 'Driver', 'Apml Workshop-PALWAL'].includes(ticket.ticket?.createdBy?.role || '')
  );

  // Get unique problems across all tickets
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

  // Find the latest ticket (by createdAt)
  const latestTicketId = tickets.length > 0 ? tickets[0].ticketId : null;

  // Handler to assign work place
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

  // Filter tickets assigned to a known workshop
  const assignedWorkshopTickets = tickets.filter(
    ticket => workPlaces.includes(ticket.ticket?.workPlace)
  );

  // Filter tickets assigned to Local
  const localTickets = tickets.filter(
    ticket => ticket.ticket?.workPlace === 'Local'
  );

  // Further filter local tickets by vehicle status
  const loadedLocalTickets = localTickets.filter(
    ticket => ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle'
  );

  const emptyLocalTickets = localTickets.filter(
    ticket => ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle'
  );

  // Helper to filter local tickets by category
  const filterLocalTicketsByCategory = (localTickets: Ticket[], categoryKey: string) => {
    return localTickets.filter(ticket => {
      const problemIs = ticket.ticket?.problemIs?.trim() || 'Other Issue/अन्य मुद्दे';

      if (categoryKey === 'Accident/एक्सीडेंट') {
        return isAccident(problemIs);
      } else if (categoryKey === 'Other Issue/अन्य मुद्दे') {
        return !isAccident(problemIs) &&
               !['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(problemIs) &&
               !problemIs.startsWith('Workshop-'); // Ensure workshop tickets are excluded even here
      } else if (['Battery/बैटरी', 'New Tyre/टायर की समस्या', 'TyrePuncher/टायर पंचर'].includes(categoryKey)) {
        return problemIs === categoryKey;
      }
      return false; // Exclude tickets for other categories (workshops) in Local sections
    });
  };

  // Define the filtering function outside the return statement
  const getTicketsForCategoryAndVehicleType = (categoryKey: string, vehicleType: 'Loaded' | 'Empty') => {
    const filteredByVehicleType = tickets.filter(ticket =>
      vehicleType === 'Loaded'
        ? (ticket.ticket?.vehicleStatusBot === 'Loadedvehicle' || ticket.ticket?.vehicleStatusBot === 'LoadedVehicle')
        : (ticket.ticket?.vehicleStatusBot === 'EmptyVehicle' || ticket.ticket?.vehicleStatusBot === 'Emptyvehicle')
    );

    // Define the list of specific workshop categories
    const specificWorkshops = ['Workshop-(Eicher)', 'Workshop-(Tata)', 'Workshop-(Ashok leyland)', 'Apml Workshop-PALWAL'];

    return filteredByVehicleType.filter(ticket => {
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
          if (!specificWorkshops.includes(workPlace || '')) { // Add this check
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        {/* <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} /> */}
        <main className="flex-1 p-8 transition-all duration-300">
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-900">
        {/* <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} /> */}
        <main className="flex-1 p-8 transition-all duration-300">
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-red-400">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <style jsx global>{styles}</style>
      {/* <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} /> */}
      <main className="flex-1 p-6 transition-all duration-300 overflow-y-auto h-screen">
        <div className="mb-8 flex items-center gap-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          <Logo size={48} />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Call Desk Dashboard</h1>
            <p className="text-base text-gray-400">Real-time vehicle ticket management system</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Loaded Vehicles Section */}
          <div className="min-w-0">
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="section-header p-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-blue-400">Loaded Vehicles</span>
                  <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                    {loadedTickets.length} tickets
                  </span>
                </h2>
              </div>

              {/* Define the order of categories and render sections for Loaded Vehicles */}
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
                  const categoryTickets = getTicketsForCategoryAndVehicleType(categoryKey, 'Loaded');

                  // Sort tickets within the category (unattended first, then newest first)
                  categoryTickets.sort((a, b) => {
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

                      <div className="table-container bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-900 text-xs border-b border-gray-700">
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">TICKET NUMBER</th>
                              <th className="w-[10%] px-4 py-3 text-left text-gray-300 font-medium">STATUS</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">VEHICLE NUMBER</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">WORK PLACE</th>
                              <th className="w-[30%] px-4 py-3 text-left text-gray-300 font-medium">DESCRIPTION</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">TIME UP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {categoryTickets.length > 0 ? (
                              categoryTickets.map((ticket: Ticket) => (
                                <tr key={ticket._id} className={`ticket-row text-xs${(ticket.ticketId === latestTicketId) ? ' bg-blue-900/30' : ''}`}>
                                  <td className="px-4 py-3 text-gray-300">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">{ticket.ticketId}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-center">
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
                                  <td className="px-4 py-3 text-gray-300">
                                    {ticket.ticket?.vehicleNumber || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-300">
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
                                  <td className="px-4 py-3 font-mono text-red-400">{formatTimeUp(ticket.createdAt, now)}</td>
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
          <div className="min-w-0">
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="section-header p-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-green-400">Empty Vehicles</span>
                  <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                    {emptyTickets.length} tickets
                  </span>
                </h2>
              </div>

              {/* Define the order of categories and render sections for Empty Vehicles */}
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
                  const categoryTickets = getTicketsForCategoryAndVehicleType(categoryKey, 'Empty');

                  // Sort tickets within the category (unattended first, then newest first)
                  categoryTickets.sort((a, b) => {
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

                      <div className="table-container bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-900 text-xs border-b border-gray-700">
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">TICKET NUMBER</th>
                              <th className="w-[10%] px-4 py-3 text-left text-gray-300 font-medium">STATUS</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">VEHICLE NUMBER</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">WORK PLACE</th>
                              <th className="w-[30%] px-4 py-3 text-left text-gray-300 font-medium">DESCRIPTION</th>
                              <th className="w-[15%] px-4 py-3 text-left text-gray-300 font-medium">TIME UP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {categoryTickets.length > 0 ? (
                              categoryTickets.map((ticket: Ticket) => (
                                <tr key={ticket._id} className={`ticket-row text-xs${(ticket.ticketId === latestTicketId) ? ' bg-blue-900/30' : ''}`}>
                                  <td className="px-4 py-3 text-gray-300">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">{ticket.ticketId}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-center">
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
                                  <td className="px-4 py-3 text-gray-300">
                                    {ticket.ticket?.vehicleNumber || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-300">
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
                                  <td className="px-4 py-3 font-mono text-red-400">{formatTimeUp(ticket.createdAt, now)}</td>
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
      </main>
    </div>
  );
}
import React from 'react';
import Button from './Button';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  currentTripStatus: string;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
  haltingHours?: number;
  waypoint?: {
    dttime: string;
    haltingHours: number;
    vname: string;
    lat: number;
    lngt: number;
    name: string;
    fullAddress: string;
  };
  shouldBlink: boolean;
  timeUp: string;
}

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  remark?: string | null;
  userName?: string | null;
  userRole?: string | null;
}

const VehicleDetailsModal = ({ 
  vehicle, 
  onClose, 
  remark = null, 
  userName = null, 
  userRole = null 
}: VehicleDetailsModalProps) => {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="glass-card w-full max-w-2xl mx-4" style={{
        background: 'rgba(30, 30, 47, 0.35)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <h2 className="text-2xl font-bold text-white">Vehicle Details</h2>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-white/5 p-4 rounded-lg backdrop-blur-md">
              <div>
                <h3 className="text-gray-400 text-sm">Vehicle Number</h3>
                <p className="text-white text-lg font-medium">{vehicle.vehicleNumber}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Vehicle Type</h3>
                <p className="text-white text-lg font-medium">{vehicle.vehicleType}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Current Status</h3>
                <span className={`status-badge inline-flex text-sm leading-5 font-semibold rounded-full ${
                  vehicle.currentTripStatus === 'in-transit' 
                    ? 'bg-green-500/20 text-green-400' 
                    : vehicle.currentTripStatus === 'maintenance'
                      ? 'bg-red-500/20 text-red-400'
                      : vehicle.currentTripStatus === 'available'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {vehicle.currentTripStatus}
                </span>
              </div>
              {remark && (
                <div>
                  <h3 className="text-gray-400 text-sm">Latest Remark</h3>
                  <p className="text-white text-lg font-medium">{remark}</p>
                </div>
              )}
              {userName && (
                <div>
                  <h3 className="text-gray-400 text-sm">Remark By</h3>
                  <p className="text-white text-lg font-medium">{userName}</p>
                </div>
              )}
              {userRole && (
                <div>
                  {/* <h3 className="text-gray-400 text-sm">User Role</h3> */}
                  {/* <p className="text-white text-lg font-medium">{userRole}</p> */}
                </div>
              )}
            </div>
            
            <div className="space-y-4 bg-white/5 p-4 rounded-lg backdrop-blur-md">
              <div>
                {/* <h3 className="text-gray-400 text-sm">Created At</h3> */}
                {/* <p className="text-white text-lg font-medium">
                  {new Date(vehicle.createdAt).toLocaleString()}
                </p> */}
              </div>
              <div>
                {/* <h3 className="text-gray-400 text-sm">Last Updated</h3>
                <p className="text-white text-lg font-medium">
                  {new Date(vehicle.updatedAt).toLocaleString()}
                </p> */}
              </div>
              {vehicle.haltingHours !== undefined && (
                <div>
                  <h3 className="text-gray-400 text-sm">Halting Hrs</h3>
                  <p className="text-white text-lg font-medium">
                    {vehicle.haltingHours} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              variant="primary" 
              onClick={onClose} 
              className="btn-primary"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal; 
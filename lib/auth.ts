import { cookies } from 'next/headers';

export interface User {
  id: string;
  name: string;
  phone: number;
  role: string;
  vehicleGroup: string;
  status: string;
  assignedVehicles: string[];
}

export function getUserFromCookies(): User | null {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (userCookie?.value) {
      return JSON.parse(userCookie.value);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get('isAuthenticated');
    return authCookie?.value === 'true';
  } catch (error) {
    return false;
  }
}

export function logout() {
  // Clear cookies on client side
  document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
} 
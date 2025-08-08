// API configuration for N8N integration
const API_CONFIG = {
  // N8N webhook URLs - replace with actual N8N webhook URLs
  baseUrl: process.env.REACT_APP_N8N_BASE_URL || 'https://your-n8n-instance.com/webhook',
  endpoints: {
    // Webhook endpoints for different operations
    getDates: '/get-dates',
    updateDates: '/update-dates',
    getVolunteers: '/get-volunteers', 
    updateVolunteers: '/update-volunteers',
    getAvailability: '/get-availability',
    updateAvailability: '/update-availability',
    getAllocations: '/get-allocations',
    updateAllocations: '/update-allocations',
    markEventComplete: '/mark-event-complete'
  }
};

// Generic API request function
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Date management API functions
export const dateAPI = {
  // Get all dates from Google Sheets via N8N
  getDates: async () => {
    return await apiRequest(API_CONFIG.endpoints.getDates);
  },
  
  // Update dates in Google Sheets via N8N
  updateDates: async (dates) => {
    return await apiRequest(API_CONFIG.endpoints.updateDates, 'POST', { dates });
  },
  
  // Mark event as complete and rotate dates
  markEventComplete: async (dateId, completedDate) => {
    return await apiRequest(API_CONFIG.endpoints.markEventComplete, 'POST', {
      dateId,
      completedDate,
      timestamp: new Date().toISOString()
    });
  }
};

// Volunteer management API functions
export const volunteerAPI = {
  // Get all volunteers from Google Sheets via N8N
  getVolunteers: async () => {
    return await apiRequest(API_CONFIG.endpoints.getVolunteers);
  },
  
  // Add or update volunteer in Google Sheets via N8N
  updateVolunteers: async (volunteers) => {
    return await apiRequest(API_CONFIG.endpoints.updateVolunteers, 'POST', { volunteers });
  },
  
  // Add new volunteer
  addVolunteer: async (volunteerData) => {
    return await apiRequest(API_CONFIG.endpoints.updateVolunteers, 'POST', {
      action: 'add',
      volunteer: volunteerData
    });
  }
};

// Availability management API functions
export const availabilityAPI = {
  // Get volunteer availability from Google Sheets via N8N
  getAvailability: async () => {
    return await apiRequest(API_CONFIG.endpoints.getAvailability);
  },
  
  // Update volunteer availability in Google Sheets via N8N
  updateAvailability: async (availability) => {
    return await apiRequest(API_CONFIG.endpoints.updateAvailability, 'POST', { availability });
  },
  
  // Save individual volunteer availability
  saveVolunteerAvailability: async (volunteerName, dates) => {
    return await apiRequest(API_CONFIG.endpoints.updateAvailability, 'POST', {
      action: 'update_volunteer',
      volunteerName,
      dates,
      timestamp: new Date().toISOString()
    });
  },
  
  // Remove volunteer availability for specific date
  removeAvailability: async (volunteerName, date) => {
    return await apiRequest(API_CONFIG.endpoints.updateAvailability, 'POST', {
      action: 'remove_date',
      volunteerName,
      date,
      timestamp: new Date().toISOString()
    });
  }
};

// Allocation management API functions
export const allocationAPI = {
  // Get all allocations from Google Sheets via N8N
  getAllocations: async () => {
    return await apiRequest(API_CONFIG.endpoints.getAllocations);
  },
  
  // Update allocations in Google Sheets via N8N
  updateAllocations: async (allocations) => {
    return await apiRequest(API_CONFIG.endpoints.updateAllocations, 'POST', { allocations });
  },
  
  // Allocate volunteer to function
  allocateVolunteer: async (date, functionName, volunteerName) => {
    return await apiRequest(API_CONFIG.endpoints.updateAllocations, 'POST', {
      action: 'allocate',
      allocation: {
        date,
        function: functionName,
        person: volunteerName,
        timestamp: new Date().toISOString()
      }
    });
  },
  
  // Deallocate volunteer from function
  deallocateVolunteer: async (date, functionName, volunteerName) => {
    return await apiRequest(API_CONFIG.endpoints.updateAllocations, 'POST', {
      action: 'deallocate',
      allocation: {
        date,
        function: functionName,
        person: volunteerName,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Sync all data with Google Sheets via N8N
export const syncAPI = {
  // Full data sync - get all data from Google Sheets
  syncFromSheets: async () => {
    try {
      const [dates, volunteers, availability, allocations] = await Promise.all([
        dateAPI.getDates(),
        volunteerAPI.getVolunteers(),
        availabilityAPI.getAvailability(),
        allocationAPI.getAllocations()
      ]);
      
      return {
        dates: dates.data || [],
        volunteers: volunteers.data || [],
        availability: availability.data || [],
        allocations: allocations.data || []
      };
    } catch (error) {
      console.error('Sync from sheets failed:', error);
      throw error;
    }
  },
  
  // Push all local data to Google Sheets
  syncToSheets: async (localData) => {
    try {
      await Promise.all([
        dateAPI.updateDates(localData.dates),
        volunteerAPI.updateVolunteers(localData.volunteers),
        availabilityAPI.updateAvailability(localData.availability),
        allocationAPI.updateAllocations(localData.allocations)
      ]);
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Sync to sheets failed:', error);
      throw error;
    }
  }
};

// Utility functions for API integration
export const apiUtils = {
  // Check if N8N is configured and available
  checkConnection: async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.warn('N8N connection check failed:', error);
      return false;
    }
  },
  
  // Format data for Google Sheets
  formatForSheets: (data, type) => {
    switch (type) {
      case 'dates':
        return data.map(date => ({
          id: date.id,
          date: date.date,
          status: date.status,
          created_at: new Date().toISOString()
        }));
        
      case 'volunteers':
        return data.map(volunteer => ({
          id: volunteer.id,
          name: volunteer.name,
          created_at: new Date().toISOString()
        }));
        
      case 'availability':
        return data.flatMap(volunteer => 
          volunteer.dates.map(date => ({
            volunteer_id: volunteer.id,
            volunteer_name: volunteer.name,
            date: date,
            created_at: new Date().toISOString()
          }))
        );
        
      case 'allocations':
        return data.map(allocation => ({
          id: allocation.id,
          date: allocation.date,
          function: allocation.function,
          person: allocation.person,
          created_at: new Date().toISOString()
        }));
        
      default:
        return data;
    }
  },
  
  // Parse data from Google Sheets format
  parseFromSheets: (data, type) => {
    switch (type) {
      case 'dates':
        return data.map(row => ({
          id: row.id,
          date: row.date,
          status: row.status || 'active'
        }));
        
      case 'volunteers':
        return data.map(row => ({
          id: row.id,
          name: row.name
        }));
        
      case 'availability':
        // Group by volunteer
        const availabilityMap = {};
        data.forEach(row => {
          if (!availabilityMap[row.volunteer_name]) {
            availabilityMap[row.volunteer_name] = {
              id: row.volunteer_id,
              name: row.volunteer_name,
              dates: []
            };
          }
          availabilityMap[row.volunteer_name].dates.push(row.date);
        });
        return Object.values(availabilityMap);
        
      case 'allocations':
        return data.map(row => ({
          id: row.id,
          date: row.date,
          function: row.function,
          person: row.person
        }));
        
      default:
        return data;
    }
  }
};

// Export default API object
const api = {
  dates: dateAPI,
  volunteers: volunteerAPI,
  availability: availabilityAPI,
  allocations: allocationAPI,
  sync: syncAPI,
  utils: apiUtils
};

export default api;


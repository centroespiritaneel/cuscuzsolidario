import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// Custom hook for API integration with N8N and Google Sheets
export const useApi = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  
  // Check N8N connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await api.utils.checkConnection();
      setIsOnline(connected);
    };
    
    checkConnection();
    
    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync data from Google Sheets
  const syncFromSheets = useCallback(async () => {
    if (!isOnline) {
      throw new Error('N8N não está disponível');
    }
    
    setSyncStatus('syncing');
    try {
      const data = await api.sync.syncFromSheets();
      setLastSync(new Date().toISOString());
      setSyncStatus('success');
      return data;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  }, [isOnline]);

  // Sync data to Google Sheets
  const syncToSheets = useCallback(async (localData) => {
    if (!isOnline) {
      throw new Error('N8N não está disponível');
    }
    
    setSyncStatus('syncing');
    try {
      const result = await api.sync.syncToSheets(localData);
      setLastSync(new Date().toISOString());
      setSyncStatus('success');
      return result;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  }, [isOnline]);

  return {
    isOnline,
    lastSync,
    syncStatus,
    syncFromSheets,
    syncToSheets,
    api
  };
};

// Hook for managing dates with API integration
export const useDates = () => {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const { api: apiClient, isOnline } = useApi();

  const loadDates = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await apiClient.dates.getDates();
        setDates(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load dates:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline]);

  const updateDate = useCallback(async (dateId, newDate) => {
    setLoading(true);
    try {
      // Update local state immediately
      setDates(prev => prev.map(d => 
        d.id === dateId ? { ...d, date: newDate, id: newDate } : d
      ));
      
      // Sync to sheets if online
      if (isOnline) {
        const updatedDates = dates.map(d => 
          d.id === dateId ? { ...d, date: newDate, id: newDate } : d
        );
        await apiClient.dates.updateDates(updatedDates);
      }
    } catch (error) {
      console.error('Failed to update date:', error);
      // Revert local state on error
      loadDates();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, dates, loadDates]);

  const markEventComplete = useCallback(async (dateId) => {
    setLoading(true);
    try {
      const completedDate = dates.find(d => d.id === dateId);
      
      // Update local state immediately
      const remainingDates = dates.filter(d => d.id !== dateId);
      const lastDate = new Date(Math.max(...remainingDates.map(d => new Date(d.date))));
      const nextSaturday = new Date(lastDate);
      nextSaturday.setDate(nextSaturday.getDate() + 14);
      
      const newDate = {
        id: nextSaturday.toISOString().split('T')[0],
        date: nextSaturday.toISOString().split('T')[0],
        status: 'active'
      };
      
      const updatedDates = [...remainingDates, newDate].sort((a, b) => new Date(a.date) - new Date(b.date));
      setDates(updatedDates);
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.dates.markEventComplete(dateId, completedDate.date);
      }
      
      return completedDate;
    } catch (error) {
      console.error('Failed to mark event complete:', error);
      // Revert local state on error
      loadDates();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, dates, loadDates]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  return {
    dates,
    loading,
    updateDate,
    markEventComplete,
    refreshDates: loadDates
  };
};

// Hook for managing volunteers with API integration
export const useVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { api: apiClient, isOnline } = useApi();

  const loadVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await apiClient.volunteers.getVolunteers();
        setVolunteers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load volunteers:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline]);

  const addVolunteer = useCallback(async (volunteerData) => {
    setLoading(true);
    try {
      // Update local state immediately
      const newVolunteer = {
        id: Date.now().toString(),
        ...volunteerData
      };
      setVolunteers(prev => [...prev, newVolunteer]);
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.volunteers.addVolunteer(newVolunteer);
      }
      
      return newVolunteer;
    } catch (error) {
      console.error('Failed to add volunteer:', error);
      // Revert local state on error
      loadVolunteers();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, loadVolunteers]);

  useEffect(() => {
    loadVolunteers();
  }, [loadVolunteers]);

  return {
    volunteers,
    loading,
    addVolunteer,
    refreshVolunteers: loadVolunteers
  };
};

// Hook for managing availability with API integration
export const useAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const { api: apiClient, isOnline } = useApi();

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await apiClient.availability.getAvailability();
        setAvailability(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline]);

  const saveAvailability = useCallback(async (volunteerName, dates) => {
    setLoading(true);
    try {
      // Update local state immediately
      const existingIndex = availability.findIndex(av => av.name === volunteerName);
      
      if (existingIndex >= 0) {
        setAvailability(prev => prev.map((av, index) => 
          index === existingIndex ? { ...av, dates } : av
        ));
      } else {
        const newAvailability = {
          id: Date.now().toString(),
          name: volunteerName,
          dates
        };
        setAvailability(prev => [...prev, newAvailability]);
      }
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.availability.saveVolunteerAvailability(volunteerName, dates);
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
      // Revert local state on error
      loadAvailability();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, availability, loadAvailability]);

  const removeAvailability = useCallback(async (volunteerName, date) => {
    setLoading(true);
    try {
      // Update local state immediately
      setAvailability(prev => prev.map(vol => 
        vol.name === volunteerName 
          ? { ...vol, dates: vol.dates.filter(d => d !== date) }
          : vol
      ));
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.availability.removeAvailability(volunteerName, date);
      }
    } catch (error) {
      console.error('Failed to remove availability:', error);
      // Revert local state on error
      loadAvailability();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, loadAvailability]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  return {
    availability,
    loading,
    saveAvailability,
    removeAvailability,
    refreshAvailability: loadAvailability
  };
};

// Hook for managing allocations with API integration
export const useAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { api: apiClient, isOnline } = useApi();

  const loadAllocations = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await apiClient.allocations.getAllocations();
        setAllocations(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline]);

  const allocateVolunteer = useCallback(async (date, functionName, volunteerName) => {
    setLoading(true);
    try {
      // Update local state immediately
      const newAllocation = {
        id: Date.now().toString(),
        date,
        function: functionName,
        person: volunteerName
      };
      setAllocations(prev => [...prev, newAllocation]);
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.allocations.allocateVolunteer(date, functionName, volunteerName);
      }
      
      return newAllocation;
    } catch (error) {
      console.error('Failed to allocate volunteer:', error);
      // Revert local state on error
      loadAllocations();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, loadAllocations]);

  const deallocateVolunteer = useCallback(async (date, functionName, volunteerName) => {
    setLoading(true);
    try {
      // Update local state immediately
      setAllocations(prev => prev.filter(alloc => 
        !(alloc.date === date && alloc.function === functionName && alloc.person === volunteerName)
      ));
      
      // Sync to sheets if online
      if (isOnline) {
        await apiClient.allocations.deallocateVolunteer(date, functionName, volunteerName);
      }
    } catch (error) {
      console.error('Failed to deallocate volunteer:', error);
      // Revert local state on error
      loadAllocations();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiClient, isOnline, loadAllocations]);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  return {
    allocations,
    loading,
    allocateVolunteer,
    deallocateVolunteer,
    refreshAllocations: loadAllocations
  };
};


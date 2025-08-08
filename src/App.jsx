import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Checkbox } from './components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Badge } from './components/ui/badge';
import {
  Calendar,
  Users,
  UserPlus,
  RefreshCw,
  Edit2,
  Check,
  X,
  LogOut,
  Trash2
} from 'lucide-react';
import logoSvg from './assets/logo.svg';
import './App.css';

// Fixed functions that always appear
const FIXED_FUNCTIONS = [
  'Equipe do Cuscuz',
  'Expositor',
  'Recepção',
  'Salão',
  'Evangelização Infantil'
];

// Authentication keys
const AUTH_KEYS = {
  volunteer: 'voluntario2025',
  coordinator: 'coordenador2025'
};

// Generate next 4 Saturday dates
const generateNextSaturdays = (startDate = new Date()) => {
  const saturdays = [];
  const current = new Date(startDate);
  
  // Find next Saturday
  const daysUntilSaturday = (6 - current.getDay()) % 7;
  if (daysUntilSaturday === 0 && current.getDay() !== 6) {
    current.setDate(current.getDate() + 7);
  } else {
    current.setDate(current.getDate() + daysUntilSaturday);
  }
  
  // Generate 4 consecutive Saturdays
  for (let i = 0; i < 4; i++) {
    saturdays.push(new Date(current));
    current.setDate(current.getDate() + 14); // Every 2 weeks
  }
  
  return saturdays.map(date => ({
    id: date.toISOString().split('T')[0],
    date: date.toISOString().split('T')[0],
    status: 'active'
  }));
};

// Mock data
const initialMockData = {
  dates: generateNextSaturdays(),
  availability: [
    { id: '1', name: 'Maria Silva', dates: [] },
    { id: '2', name: 'João Santos', dates: [] },
    { id: '3', name: 'Ana Costa', dates: [] },
    { id: '4', name: 'Pedro Lima', dates: [] },
    { id: '5', name: 'Carla Oliveira', dates: [] }
  ],
  allocations: []
};

// Simple toast notification system
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-md text-white font-medium ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    type === 'warning' ? 'bg-yellow-600' :
    'bg-blue-600'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Data state
  const [dates, setDates] = useState(initialMockData.dates);
  const [availability, setAvailability] = useState(initialMockData.availability);
  const [allocations, setAllocations] = useState(initialMockData.allocations);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [volunteerName, setVolunteerName] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [newVolunteerName, setNewVolunteerName] = useState('');
  
  // Modal states
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showEditDate, setShowEditDate] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [showAllocation, setShowAllocation] = useState(false);
  const [allocationData, setAllocationData] = useState({ volunteer: '', date: '', function: '' });

  // Utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to ensure UTC interpretation
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const authenticate = (key) => {
    if (key === AUTH_KEYS.volunteer) {
      setIsAuthenticated(true);
      setUserType('volunteer');
      setCurrentUser('Voluntário');
      setAuthError('');
      return true;
    } else if (key === AUTH_KEYS.coordinator) {
      setIsAuthenticated(true);
      setUserType('coordinator');
      setCurrentUser('Coordenador');
      setAuthError('');
      return true;
    }
    setAuthError('Chave de acesso inválida. Tente novamente.');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentUser(null);
    setAccessKey('');
    setAuthError('');
    showToast('Logout realizado com sucesso', 'info');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authenticate(accessKey)) {
      showToast(`Bem-vindo, ${userType === 'coordinator' ? 'Coordenador' : 'Voluntário'}!`);
    }
  };

  // Date management functions
  const markEventComplete = async (dateId) => {
    setLoading(true);
    try {
      // Remove completed date and add new one
      const completedDate = dates.find(d => d.id === dateId);
      const remainingDates = dates.filter(d => d.id !== dateId);
      
      // Generate next Saturday after the last remaining date
      const lastDate = new Date(Math.max(...remainingDates.map(d => new Date(d.date + 'T00:00:00')))); // Add T00:00:00
      const nextSaturday = new Date(lastDate);
      nextSaturday.setDate(nextSaturday.getDate() + 14);
      
      const newDate = {
        id: nextSaturday.toISOString().split('T')[0],
        date: nextSaturday.toISOString().split('T')[0],
        status: 'active'
      };
      
      // Update dates (remove completed, add new)
      const updatedDates = [...remainingDates, newDate].sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00')); // Add T00:00:00
      setDates(updatedDates);
      
      // Remove allocations for completed date
      setAllocations(prev => prev.filter(alloc => alloc.date !== completedDate.date));
      
      // Remove availability for completed date
      setAvailability(prev => prev.map(vol => ({
        ...vol,
        dates: vol.dates.filter(date => date !== completedDate.date)
      })));
      
      showToast(`Evento de ${formatDate(completedDate.date)} marcado como concluído!`);
    } catch (error) {
      showToast('Erro ao marcar evento como concluído', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateDate = async (dateId, newDateValue) => {
    setLoading(true);
    try {
      const oldDate = dates.find(d => d.id === dateId);
      
      // Update dates
      setDates(prev => prev.map(d => 
        d.id === dateId ? { ...d, date: newDateValue, id: newDateValue } : d
      ).sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'))); // Add T00:00:00
      
      // Update availability
      setAvailability(prev => prev.map(vol => ({
        ...vol,
        dates: vol.dates.map(date => date === oldDate.date ? newDateValue : date)
      })));
      
      // Update allocations
      setAllocations(prev => prev.map(alloc => 
        alloc.date === oldDate.date ? { ...alloc, date: newDateValue } : alloc
      ));
      
      showToast('Data atualizada com sucesso!');
      setShowEditDate(false);
      setEditingDate(null);
    } catch (error) {
      showToast('Erro ao atualizar data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Volunteer management functions
  const saveAvailability = async () => {
    if (!volunteerName.trim()) {
      showToast('Por favor, digite seu nome.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const existingIndex = availability.findIndex(av => av.name === volunteerName);
      
      if (existingIndex >= 0) {
        setAvailability(prev => prev.map((av, index) => 
          index === existingIndex ? { ...av, dates: selectedDates } : av
        ));
      } else {
        setAvailability(prev => [...prev, {
          id: Date.now().toString(),
          name: volunteerName,
          dates: selectedDates
        }]);
      }
      
      showToast('Disponibilidade salva com sucesso!');
      setVolunteerName('');
      setSelectedDates([]);
    } catch (error) {
      showToast('Erro ao salvar disponibilidade', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNewVolunteer = async () => {
    if (!newVolunteerName.trim()) {
      showToast('Por favor, digite o nome do voluntário.', 'warning');
      return;
    }
    
    const exists = availability.some(vol => 
      vol.name.toLowerCase() === newVolunteerName.toLowerCase()
    );
    
    if (exists) {
      showToast('Voluntário já existe!', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      setAvailability(prev => [...prev, {
        id: Date.now().toString(),
        name: newVolunteerName,
        dates: []
      }]);
      
      showToast(`${newVolunteerName} adicionado com sucesso!`);
      setNewVolunteerName('');
      setShowAddVolunteer(false);
    } catch (error) {
      showToast('Erro ao adicionar voluntário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeVolunteerAvailability = (volunteerName, dateToRemove) => {
    setAvailability(prev => prev.map(vol => 
      vol.name === volunteerName 
        ? { ...vol, dates: vol.dates.filter(date => date !== dateToRemove) }
        : vol
    ));
    
    // Also remove any allocations for this volunteer on this date
    setAllocations(prev => prev.filter(alloc => 
      !(alloc.person === volunteerName && alloc.date === dateToRemove)
    ));
    
    showToast(`Disponibilidade de ${volunteerName} removida para ${formatDate(dateToRemove)}`, 'info');
  };

  // New function for volunteers to remove their own availability
  const removeMyAvailability = (dateToRemove) => {
    if (!volunteerName.trim()) {
      showToast('Por favor, digite seu nome primeiro.', 'warning');
      return;
    }
    
    const volunteerExists = availability.find(vol => vol.name === volunteerName);
    if (!volunteerExists) {
      showToast('Você não está cadastrado no sistema.', 'warning');
      return;
    }
    
    const hasAvailability = volunteerExists.dates.includes(dateToRemove);
    if (!hasAvailability) {
      showToast('Você não está disponível para esta data.', 'warning');
      return;
    }
    
    // Remove from selectedDates if it's there
    setSelectedDates(prev => prev.filter(date => date !== dateToRemove));
    
    // Remove from availability state
    setAvailability(prev => prev.map(vol => 
      vol.name === volunteerName 
        ? { ...vol, dates: vol.dates.filter(date => date !== dateToRemove) }
        : vol
    ));
    
    // Also remove any allocations for this volunteer on this date
    setAllocations(prev => prev.filter(alloc => 
      !(alloc.person === volunteerName && alloc.date === dateToRemove)
    ));
    
    showToast(`Sua disponibilidade foi removida para ${formatDate(dateToRemove)}`, 'info');
  };

  // Get current volunteer's availability for display
  const getCurrentVolunteerAvailability = () => {
    if (!volunteerName.trim()) return [];
    const volunteer = availability.find(vol => vol.name === volunteerName);
    return volunteer ? volunteer.dates : [];
  };

  // Allocation functions
  const allocateVolunteer = async (date, func, person) => {
    setLoading(true);
    try {
      setAllocations(prev => [...prev, {
        id: Date.now().toString(),
        date,
        function: func,
        person
      }]);
      
      showToast(`${person} alocado(a) para ${func}!`);
      setShowAllocation(false);
      setAllocationData({ volunteer: '', date: '', function: '' });
    } catch (error) {
      showToast('Erro ao alocar voluntário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deallocateVolunteer = async (date, func, person) => {
    setLoading(true);
    try {
      setAllocations(prev => prev.filter(alloc => 
        !(alloc.date === date && alloc.function === func && alloc.person === person)
      ));
      
      showToast(`${person} desalocado(a) de ${func}!`, 'info');
    } catch (error) {
      showToast('Erro ao desalocar voluntário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerClick = (volunteerName, date) => {
    if (userType === 'coordinator') {
      setAllocationData({ volunteer: volunteerName, date, function: '' });
      setShowAllocation(true);
    }
  };

  const handleAllocatedClick = (volunteerName, date, func) => {
    if (userType === 'coordinator') {
      if (window.confirm(`Desalocar ${volunteerName} da função ${func}?`)) {
        deallocateVolunteer(date, func, volunteerName);
      }
    }
  };

  // Render date cards
  const renderDateCards = () => {
    return dates.map(dateObj => {
      const availableVolunteers = availability.filter(av => 
        av.dates.includes(dateObj.date)
      );
      
      const dateAllocations = allocations.filter(alloc => 
        alloc.date === dateObj.date
      );
      
      const allocatedNames = dateAllocations.map(alloc => alloc.person);
      const unallocatedVolunteers = availableVolunteers.filter(vol => 
        !allocatedNames.includes(vol.name)
      );
      
      // Group allocations by function
      const allocationsByFunction = {};
      FIXED_FUNCTIONS.forEach(func => {
        allocationsByFunction[func] = dateAllocations
          .filter(alloc => alloc.function === func)
          .map(alloc => alloc.person);
      });
      
      return (
        <Card key={dateObj.id} className="date-card">
          <CardHeader className="date-card-header">
            <CardTitle className="date-card-title">
              {formatDate(dateObj.date)}
            </CardTitle>
            <div className="flex items-center gap-2">
              {userType === 'coordinator' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Ensure the date is in YYYY-MM-DD format for the input type="date"
                      // and handle timezone offset for consistent display
                      const date = new Date(dateObj.date);
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const day = date.getDate().toString().padStart(2, '0');
                      const formattedDate = `${year}-${month}-${day}`;
                      setEditingDate({ ...dateObj, date: formattedDate });
                      setShowEditDate(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markEventComplete(dateObj.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Badge className="date-card-count">
                {availableVolunteers.length} disponíveis
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Available volunteers */}
            <div className="function-section">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                Disponíveis 
                <Badge variant="secondary">{unallocatedVolunteers.length}</Badge>
              </h4>
              <div className="flex flex-wrap gap-2">
                {unallocatedVolunteers.length > 0 ? (
                  unallocatedVolunteers.map(vol => (
                    <div key={vol.name} className="flex items-center gap-1">
                      <span
                        className="volunteer-item available"
                        onClick={() => handleVolunteerClick(vol.name, dateObj.date)}
                      >
                        {vol.name}
                      </span>
                      {userType === 'coordinator' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVolunteerAvailability(vol.name, dateObj.date)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Nenhum voluntário disponível</div>
                )}
              </div>
            </div>
            
            {/* Fixed functions */}
            <div className="function-section">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                Alocados 
                <Badge variant="secondary">{dateAllocations.length}</Badge>
              </h4>
              <div className="space-y-3">
                {FIXED_FUNCTIONS.map(func => (
                  <div key={func}>
                    <div className="function-title">{func}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allocationsByFunction[func].length > 0 ? (
                        allocationsByFunction[func].map(person => (
                          <span
                            key={person}
                            className="volunteer-item allocated"
                            onClick={() => handleAllocatedClick(person, dateObj.date, func)}
                          >
                            {person}
                          </span>
                        ))
                      ) : (
                        <div className="empty-state text-xs">Ninguém alocado</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logoSvg} alt="Logo Cuscuz Solidário" className="w-12 h-12" />
              <div>
                <CardTitle className="text-2xl text-primary">Cuscuz Solidário</CardTitle>
                <p className="text-sm text-muted-foreground">NEEL - Núcleo Espírita Esperança de Luz</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold">Acesso ao Sistema</h2>
            <p className="text-muted-foreground">Digite sua chave de acesso para continuar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="accessKey">Chave de Acesso</Label>
                <Input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  required
                />
              </div>
              {authError && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  {authError}
                </div>
              )}
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="Logo Cuscuz Solidário" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-primary">Cuscuz Solidário</h1>
                <span className="text-xs text-muted-foreground">NEEL - Núcleo Espírita Esperança de Luz</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Logado como: {currentUser}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Availability Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Marcar Disponibilidade
            </CardTitle>
            <p className="text-muted-foreground">
              Selecione as datas em que você estará disponível para ajudar
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="volunteerName">Seu Nome</Label>
                <Input
                  id="volunteerName"
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  placeholder="Digite seu nome"
                />
              </div>
              <div>
                <Label>Datas Disponíveis</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {dates.map(dateObj => (
                    <div key={dateObj.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`date-${dateObj.id}`}
                        checked={selectedDates.includes(dateObj.date)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDates(prev => [...prev, dateObj.date]);
                          } else {
                            setSelectedDates(prev => prev.filter(d => d !== dateObj.date));
                          }
                        }}
                      />
                      <Label htmlFor={`date-${dateObj.id}`} className="text-sm">
                        {formatDate(dateObj.date)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={saveAvailability} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirmar Disponibilidade
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Volunteer's Availability - Only show for volunteers */}
        {userType === 'volunteer' && volunteerName.trim() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suas Disponibilidades
              </CardTitle>
              <p className="text-muted-foreground">
                Datas em que você está disponível. Clique no X para remover uma data.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getCurrentVolunteerAvailability().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCurrentVolunteerAvailability().map(date => (
                      <div key={date} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-sm font-medium text-green-800">
                          {formatDate(date)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMyAvailability(date)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não se disponibilizou para nenhuma data.</p>
                    <p className="text-sm">Use o formulário acima para marcar sua disponibilidade.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coordinator Controls */}
        {userType === 'coordinator' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Controles do Coordenador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Dialog open={showAddVolunteer} onOpenChange={setShowAddVolunteer}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Voluntário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Voluntário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newVolunteerName">Nome do Voluntário</Label>
                        <Input
                          id="newVolunteerName"
                          value={newVolunteerName}
                          onChange={(e) => setNewVolunteerName(e.target.value)}
                          placeholder="Digite o nome do voluntário"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addNewVolunteer} disabled={loading}>
                          Adicionar
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddVolunteer(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
            <p className="text-muted-foreground">
              Visualize a disponibilidade e alocação de voluntários
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderDateCards()}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Date Modal */}
      <Dialog open={showEditDate} onOpenChange={setShowEditDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Data da Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDate">Nova Data</Label>
              <Input
                id="editDate"
                type="date"
                value={editingDate?.date || ''}
                onChange={(e) => setEditingDate(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => updateDate(editingDate?.id, editingDate?.date)}
                disabled={loading}
              >
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setShowEditDate(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation Modal */}
      <Dialog open={showAllocation} onOpenChange={setShowAllocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alocar Voluntário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p><strong>Voluntário:</strong> {allocationData.volunteer}</p>
              <p><strong>Data:</strong> {formatDate(allocationData.date)}</p>
            </div>
            <div>
              <Label htmlFor="function">Função</Label>
              <select
                id="function"
                className="w-full p-2 border border-border rounded-md"
                value={allocationData.function}
                onChange={(e) => setAllocationData(prev => ({ ...prev, function: e.target.value }))}
              >
                <option value="">Selecione uma função</option>
                {FIXED_FUNCTIONS.map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => allocateVolunteer(allocationData.date, allocationData.function, allocationData.volunteer)}
                disabled={loading || !allocationData.function}
              >
                Alocar
              </Button>
              <Button variant="outline" onClick={() => setShowAllocation(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;






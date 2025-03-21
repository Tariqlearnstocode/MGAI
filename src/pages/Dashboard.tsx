import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search, ChevronDown, CheckCircle2, Clock, FileText, Files, Coins, Lock, Unlock, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project, Document } from '@/lib/projects';
import { usePayment } from '@/contexts/PaymentContext';

interface ProjectWithDocuments extends Project {
  documents: Document[];
  is_unlocked?: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortOrder, setSortOrder] = useState('Descending');
  const [applyingCredit, setApplyingCredit] = useState<string | null>(null);
  const [creditResult, setCreditResult] = useState<{id: string, success: boolean, message: string} | null>(null);
  const { creditBalance, loadingCredits, applyCredit, refreshCreditBalance } = usePayment();

  useEffect(() => {
    loadProjects();
  }, []);
  
  async function loadProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          documents (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error('No data returned from query');
      
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const handleApplyCredit = async (projectId: string) => {
    if (creditBalance <= 0) {
      setCreditResult({
        id: projectId,
        success: false,
        message: 'No credits available'
      });
      return;
    }
    
    setApplyingCredit(projectId);
    setCreditResult(null);
    
    try {
      const result = await applyCredit(projectId);
      setCreditResult({
        id: projectId,
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        // Refresh projects to show the updated unlock status
        await loadProjects();
        // Refresh credit balance
        await refreshCreditBalance();
      }
    } catch (err) {
      setCreditResult({
        id: projectId,
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setApplyingCredit(null);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your documentation workspace
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Available Credits</h3>
              <Coins className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2">
              {loadingCredits ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-blue-600">{creditBalance}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Credits Available
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Time Saved</h3>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-semibold text-blue-600">
                {(projects.reduce((acc, p) => acc + (p.documents?.filter(d => d.status === 'completed').length || 0), 0) * 2.5).toFixed(1)} hours
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ~2.5 hours saved per document
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Documents Created</h3>
              <Files className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-semibold text-blue-600">
                {projects.reduce((acc, p) => acc + (p.documents?.filter(d => d.status === 'completed').length || 0), 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Completed documents
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Projects Completed</h3>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-semibold text-blue-600">
                {projects.filter(p => p.documents?.every(d => d.status === 'completed')).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Out of {projects.length} total projects
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <Button onClick={() => navigate('/app/new-project')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Status</option>
                <option>Draft</option>
                <option>Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Descending</option>
                <option>Ascending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Project Unlock Status Section */}
        {creditBalance > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Unlock Projects with Credits</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-600">
                    You have {creditBalance} credit{creditBalance !== 1 ? 's' : ''} available to unlock projects
                  </span>
                </div>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {projects.map(project => (
                    <div key={project.id} className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                      </div>
                      
                      <div className="flex items-center">
                        {project.is_unlocked ? (
                          <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                            <Unlock className="h-4 w-4 mr-1" />
                            Unlocked
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            {creditResult && creditResult.id === project.id && (
                              <div className={`text-sm px-2 py-1 rounded ${creditResult.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                {creditResult.message}
                              </div>
                            )}
                            <Button 
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                handleApplyCredit(project.id);
                              }}
                              disabled={applyingCredit === project.id || creditBalance <= 0}
                            >
                              {applyingCredit === project.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Use Credit to Unlock
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No projects yet. Click "New Project" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects
              .filter(project => 
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((project) => (
                <Link
                  key={project.id}
                  to={`/app/projects/${project.id}/documents`}
                  className="block bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          <div className="flex items-center gap-2">
                            {project.name}
                            {project.documents.every(doc => doc.status === 'completed') && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {project.is_unlocked && (
                              <Unlock className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            {Math.round((project.documents.filter(doc => doc.status === 'completed').length / project.documents.length) * 100)}%
                          </span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(project.documents.filter(doc => doc.status === 'completed').length / project.documents.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {project.documents.filter(doc => doc.status === 'completed').length} of {project.documents.length} complete
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Last modified: {new Date(project.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
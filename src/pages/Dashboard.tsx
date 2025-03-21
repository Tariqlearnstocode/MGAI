import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search, ChevronDown, CheckCircle2, Clock, FileText, Files, Coins, Lock, Unlock, CreditCard, XCircle, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project, Document } from '@/lib/projects';
import { usePayment } from '@/contexts/PaymentContext';
import { CheckoutButton } from '@/components/ui/CheckoutButton';

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
  
  const handleApplyCredit = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
        
        // Clear the result after 3 seconds
        setTimeout(() => {
          setCreditResult(null);
        }, 3000);
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

  const handleEditProject = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to edit project page or open edit modal
    navigate(`/app/projects/${projectId}/edit`);
  };
  
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Show confirmation dialog before deleting
    if (window.confirm('Are you sure you want to delete this project?')) {
      // Add delete logic here
      console.log('Delete project:', projectId);
    }
  };

  // Helper function to format business type for display
  const formatBusinessType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'local_business':
        return 'Local Business';
      case 'saas':
        return 'SaaS';
      default:
        // Convert snake_case to Title Case
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  // Helper function to get tag colors based on business type
  const getBusinessTypeColors = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'local_business':
        return 'bg-blue-100 text-blue-800';
      case 'saas':
        return 'bg-purple-100 text-purple-800';
      case 'ecommerce':
        return 'bg-green-100 text-green-800';
      case 'agency':
        return 'bg-indigo-100 text-indigo-800';
      case 'finance':
        return 'bg-emerald-100 text-emerald-800';
      case 'health':
        return 'bg-teal-100 text-teal-800';
      case 'education':
        return 'bg-amber-100 text-amber-800';
      case 'food':
        return 'bg-orange-100 text-orange-800';
      case 'travel':
        return 'bg-rose-100 text-rose-800';
      case 'tech':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-full bg-gray-100">
      {/* Credit info banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-blue-700 font-medium">
                {creditBalance} Credit{creditBalance !== 1 ? 's' : ''} Available
              </span>
              <span className="mx-2 text-blue-300">•</span>
              <span className="text-blue-600">
                {/* Randomly select one of these messages - we'll use the modulo of the current minute */}
                {(() => {
                  const messages = [
                    "It only costs 1 credit to unlock all documents within your project",
                    "Unlock unlimited documents in each project with just 1 credit",
                    "Get full access to all project documents with a single credit",
                    "One credit gives you complete access to an entire project",
                    "Use 1 credit to unlock everything in your marketing project",
                    "Generate complete marketing documentation with just 1 credit per project"
                  ];
                  const index = new Date().getMinutes() % messages.length;
                  return messages[index];
                })()}
              </span>
            </div>
            <CheckoutButton
              productId="agency_pack"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md mr-2"
              size="sm"
              showArrow={false}
            >
              {creditBalance === 0 
                ? "Start Marketing for as low as $39.99" 
                : "Buy More Credits"}
            </CheckoutButton>
          </div>
        </div>
      </div>
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your documentation workspace
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Time Saved Card */}
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

          {/* Documents Created Card */}
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

          {/* Projects Completed Card */}
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

        {/* Projects List and Tips section - 2/3 and 1/3 layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Projects Section - 2/3 width */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
                        className="block bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors relative"
                      >
                        {creditResult && creditResult.id === project.id && (
                          <div className={`absolute top-2 right-2 px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                            creditResult.success 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {creditResult.success 
                              ? <CheckCircle2 className="h-4 w-4 mr-1.5" /> 
                              : <XCircle className="h-4 w-4 mr-1.5" />
                            }
                            {creditResult.message}
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 mr-4">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                <div className="flex items-center gap-2">
                                  {project.name}
                                  {project.documents.every(doc => doc.status === 'completed') && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {project.is_unlocked && (
                                    <Unlock className="h-4 w-4 text-green-500" />
                                  )}
                                  {!project.is_unlocked && (
                                    <Lock className="h-4 w-4 text-amber-500" />
                                  )}
                                </div>
                              </h3>
                              <div className="flex items-center mb-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBusinessTypeColors(project.business_type || "Business")}`}>
                                  {formatBusinessType(project.business_type || "Business")}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleEditProject(project.id, e)}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                  title="Edit project"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                  title="Delete project"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                              </div>
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
                              
                              {/* Add unlock button if project is not unlocked and user has credits */}
                              {!project.is_unlocked && creditBalance > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 mt-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 hover:border-green-300"
                                  onClick={(e) => handleApplyCredit(project.id, e)}
                                  disabled={applyingCredit === project.id}
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
                              )}
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
          
          {/* Tips Section - 1/3 width */}
          <div className="hidden lg:block w-full lg:w-1/3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 rounded-full p-1.5">
                    <Files className="h-5 w-5 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Marketing Tips</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Enhance your marketing documentation
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Define clear audience personas in your marketing plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Include key differentiators between your business and competitors</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Document specific marketing KPIs and success metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Outline your content marketing distribution channels</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Create a consistent brand voice guideline</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Develop a clear positioning statement for market segments</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Document your social media strategy and content calendar</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Include competitive pricing analysis in your strategy</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-gray-600">Align marketing goals with overall business objectives</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
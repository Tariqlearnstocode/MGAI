import { FileText, Target, Users, BarChart3, DollarSign, ShoppingCart, Globe, Heart, Megaphone, Share2, MessageSquare, Mail, Laptop,
  Palette, Rocket, Calendar, AtSign, LucideIcon } from 'lucide-react';
import { supabase } from './supabase';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  promptTemplate: string;
  documentOrder: number;
  requiredInfo?: {
    questions: Array<{
      id: string;
      question: string;
      type: 'text' | 'color' | 'image' | 'select' | 'multi-select';
      options?: string[];
      placeholder?: string;
    }>;
  };
}

// Mapping of string IDs to icon components
const iconMap: Record<string, LucideIcon> = {
  'FileText': FileText,
  'Target': Target,
  'Users': Users,
  'BarChart3': BarChart3,
  'DollarSign': DollarSign,
  'ShoppingCart': ShoppingCart,
  'Globe': Globe,
  'Heart': Heart,
  'Megaphone': Megaphone,
  'Share2': Share2,
  'MessageSquare': MessageSquare,
  'Mail': Mail,
  'Laptop': Laptop,
  'Palette': Palette,
  'Rocket': Rocket,
  'Calendar': Calendar,
  'AtSign': AtSign
};

/**
 * Fetches document types from Supabase
 */
export async function getLatestDocumentTypes(): Promise<DocumentType[]> {
  try {
    console.log('Fetching document types from Supabase database...');
    
    // Log that we're about to make the Supabase call
    console.log('Making Supabase query to document_types table');
    
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('document_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching document types from Supabase:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }
    
    console.log('Successfully received document_types data:', data?.length || 0, 'records');
    console.log('First document type (raw):', data && data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No data');
    
    if (data && data.length === 0) {
      console.warn('Warning: No document types found in the database');
      return [];
    }
    
    // Process each document type to convert string icon names to actual icon components
    // and parse any JSON fields (like requiredInfo)
    const processedDocTypes = data.map(item => {
      console.log('Processing document type:', item.id, item.name);
      
      // Handle both camelCase and snake_case field names from the database
      const id = item.id;
      const name = item.name;
      const description = item.description;
      const iconName = item.icon || '';
      const promptTemplate = item.prompt_template || item.promptTemplate || '';
      const requiredInfoRaw = item.required_info || item.requiredInfo;
      const documentOrder = item.document_order || Number.MAX_SAFE_INTEGER;
      
      // Parse requiredInfo if it exists and is a string
      let parsedRequiredInfo = requiredInfoRaw;
      if (typeof requiredInfoRaw === 'string') {
        try {
          parsedRequiredInfo = JSON.parse(requiredInfoRaw);
        } catch (e) {
          console.error('Error parsing requiredInfo:', e);
          parsedRequiredInfo = undefined;
        }
      }
      
      // Get the icon component from the map or default to FileText
      console.log('Looking for icon:', iconName);
      const iconComponent = iconName && iconMap[iconName] ? iconMap[iconName] : FileText;
      
      const docType = {
        id,
        name,
        description,
        icon: iconComponent,
        promptTemplate,
        requiredInfo: parsedRequiredInfo,
        documentOrder
      };
      
      console.log('Processed document type:', docType.id, docType.name);
      return docType;
    });
    
    console.log('Returning processed document types:', processedDocTypes.length);
    return processedDocTypes;
  } catch (error) {
    console.error('Unexpected error fetching document types:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return default document types as a fallback
    console.warn('No document types could be fetched, returning empty array');
    return [];
  }
}

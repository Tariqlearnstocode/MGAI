import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject } from '@/lib/projects';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentSidebar from '@/components/DocumentSidebar';
import type { Project, Document } from '@/lib/projects';

export interface DocumentContent {
  [key: string]: {
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
}

const DOCUMENT_CONTENT: DocumentContent = {
  marketing_plan: {
    sections: [
      {
        title: 'Executive Summary',
        content: 'This comprehensive marketing plan outlines our strategy for achieving sustainable growth through targeted customer acquisition, brand development, and market expansion.'
      },
      {
        title: 'Market Analysis',
        content: 'Our analysis reveals significant opportunities in the target market, with growing demand for innovative solutions and a clear gap in current offerings.'
      },
      {
        title: 'Marketing Strategy',
        content: 'We will implement a multi-channel approach focusing on digital presence, content marketing, and strategic partnerships to reach and engage our target audience.'
      }
    ]
  },
  brand_guidelines: {
    sections: [
      {
        title: 'Brand Story',
        content: 'Our brand represents innovation, reliability, and customer-centricity, built on a foundation of delivering exceptional value to our clients.'
      },
      {
        title: 'Voice & Tone',
        content: 'Communications should be professional yet approachable, emphasizing expertise while maintaining accessibility and clarity.'
      },
      {
        title: 'Visual Guidelines',
        content: 'Our visual identity employs a clean, modern aesthetic that reflects our innovative approach while ensuring consistency across all touchpoints.'
      }
    ]
  },
  customer_acquisition: {
    sections: [
      {
        title: 'Acquisition Strategy',
        content: 'Our customer acquisition strategy focuses on targeted digital marketing, content-driven lead generation, and strategic partnerships.'
      },
      {
        title: 'Channel Mix',
        content: 'We will leverage a combination of SEO, paid advertising, and social media to create multiple touchpoints for potential customers.'
      },
      {
        title: 'Conversion Optimization',
        content: 'Continuous testing and optimization of landing pages, forms, and the sales funnel will maximize conversion rates.'
      }
    ]
  },
  pricing_strategy: {
    sections: [
      {
        title: 'Pricing Model',
        content: 'Our value-based pricing strategy reflects the premium quality of our offerings while remaining competitive in the market.'
      },
      {
        title: 'Market Positioning',
        content: 'Positioning as a premium solution provider allows us to command higher prices while delivering exceptional value.'
      },
      {
        title: 'Pricing Tiers',
        content: 'Multiple pricing tiers cater to different customer segments, with clear value differentiation between each level.'
      }
    ]
  },
  sales_strategy: {
    sections: [
      {
        title: 'Sales Process',
        content: 'Our consultative sales approach focuses on understanding customer needs and demonstrating clear value proposition.'
      },
      {
        title: 'Lead Qualification',
        content: 'Structured qualification criteria ensure we focus resources on the most promising opportunities.'
      },
      {
        title: 'Sales Enablement',
        content: 'Comprehensive training and tools equip our team to effectively communicate value and handle objections.'
      }
    ]
  },
  audience_personas: {
    sections: [
      {
        title: 'Primary Persona',
        content: 'Decision-makers in growing companies who prioritize efficiency and ROI in their business solutions.'
      },
      {
        title: 'Needs Analysis',
        content: 'Key pain points include time management, resource optimization, and scaling operations efficiently.'
      },
      {
        title: 'Buying Behavior',
        content: 'Research-driven decision process with emphasis on proven results and implementation support.'
      }
    ]
  },
  digital_presence: {
    sections: [
      {
        title: 'Website Strategy',
        content: 'Our website will serve as a central hub for information, lead generation, and customer engagement.'
      },
      {
        title: 'Content Strategy',
        content: 'Regular, high-quality content will establish thought leadership and drive organic traffic.'
      },
      {
        title: 'SEO Framework',
        content: 'Comprehensive SEO strategy targeting key industry terms and solving customer pain points.'
      }
    ]
  },
  customer_retention: {
    sections: [
      {
        title: 'Retention Strategy',
        content: 'Proactive engagement and value-added services will maintain high customer satisfaction and loyalty.'
      },
      {
        title: 'Customer Success',
        content: 'Dedicated support ensures customers achieve their goals and maximize platform value.'
      },
      {
        title: 'Loyalty Program',
        content: 'Tiered benefits reward long-term customers and encourage increased platform usage.'
      }
    ]
  },
  kpi_tracking: {
    sections: [
      {
        title: 'Key Metrics',
        content: 'Critical KPIs include customer acquisition cost, lifetime value, and engagement rates.'
      },
      {
        title: 'Reporting Framework',
        content: 'Regular reporting cycles with actionable insights drive continuous improvement.'
      },
      {
        title: 'Performance Goals',
        content: 'Specific, measurable targets aligned with business objectives guide our efforts.'
      }
    ]
  },
  advertising_plan: {
    sections: [
      {
        title: 'Campaign Strategy',
        content: 'Multi-channel advertising approach targeting key customer segments across relevant platforms.'
      },
      {
        title: 'Budget Allocation',
        content: 'Strategic budget distribution across channels based on performance and ROI metrics.'
      },
      {
        title: 'Creative Direction',
        content: 'Compelling messaging and visuals that resonate with our target audience and drive action.'
      }
    ]
  },
  pr_awareness: {
    sections: [
      {
        title: 'PR Strategy',
        content: 'Proactive media relations and thought leadership position us as industry experts.'
      },
      {
        title: 'Brand Building',
        content: 'Consistent brand messaging across all channels strengthens market presence.'
      },
      {
        title: 'Crisis Management',
        content: 'Comprehensive plan for maintaining brand reputation during challenging situations.'
      }
    ]
  },
  outbound_marketing: {
    sections: [
      {
        title: 'Outreach Strategy',
        content: 'Personalized communication approach targeting qualified prospects across multiple channels.'
      },
      {
        title: 'Campaign Structure',
        content: 'Systematic outreach sequences with tailored messaging for each target segment.'
      },
      {
        title: 'Response Management',
        content: 'Efficient follow-up processes maximize engagement and conversion opportunities.'
      }
    ]
  }
};

export default function ProjectDocuments() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDoc, setSelectedDoc] = useState('marketing_plan');
  const [project, setProject] = useState<Project & { documents: Document[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDoc(docId);
  };

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <DocumentSidebar
        documents={project.documents}
        selectedDoc={selectedDoc}
        onDocumentSelect={handleDocumentSelect}
        onBack={() => navigate('/app')}
      />
      <div className="flex-1 overflow-hidden">
        <DocumentViewer
          project={project}
          selectedDoc={selectedDoc}
          onDocumentSelect={handleDocumentSelect}
        />
      </div>
    </div>
  );
}
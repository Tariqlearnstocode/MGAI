import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Document } from '@/lib/projects';

export function useDocumentSubscription(documentId: string | undefined) {
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    // Subscribe to document changes
    const subscription = supabase
      .channel(`document-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          const updatedDoc = payload.new as Document;
          setDocument(updatedDoc);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          setError('Failed to subscribe to document updates');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [documentId]);

  return { document, error };
}
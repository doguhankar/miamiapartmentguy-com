'use client';

import { Suspense } from 'react';
import { AgentMapExperience } from '@/components/agent-map-experience';

export default function SebPage() {
  return (
    <Suspense fallback={null}>
      <AgentMapExperience
        agentId="sebastian@miamiapartmentguy.com"
        source="Seb Landing Page"
        slackChannel="leads-seb"
      />
    </Suspense>
  );
}

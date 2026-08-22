'use client';

import { Suspense } from 'react';
import { AgentMapExperience } from '@/components/agent-map-experience';

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <AgentMapExperience
        agentId="doguhankar1@gmail.com"
        source="Homepage Form"
        slackChannel="leads-don"
      />
    </Suspense>
  );
}

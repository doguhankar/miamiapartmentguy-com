'use client';

import { AgentMapExperience } from '@/components/agent-map-experience';

export default function SebPage() {
  return (
    <AgentMapExperience
      agentId="sebastian@miamiapartmentguy.com"
      source="Seb Landing Page"
      slackChannel="leads-seb"
    />
  );
}

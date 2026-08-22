'use client';

import { AgentMapExperience } from '@/components/agent-map-experience';

export default function MapPage() {
  return (
    <AgentMapExperience
      agentId="doguhankar1@gmail.com"
      source="Homepage Form"
      slackChannel="leads-don"
    />
  );
}

import { redirect } from 'next/navigation'

// People screen replaced Clients list. Existing deep links (/mag/clients/:id) still work.
export default function ClientsListRedirect() {
  redirect('/mag/people')
}

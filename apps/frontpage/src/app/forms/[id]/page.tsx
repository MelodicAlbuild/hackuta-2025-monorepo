import { notFound } from 'next/navigation';

import VolunteerRegistrationForm from '../_components/volunteer-registration-form';

interface FormPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FormByCodePage({ params }: FormPageProps) {
  const { id } = await params;

  if (id === '398350') {
    return <VolunteerRegistrationForm />;
  }

  notFound();
}

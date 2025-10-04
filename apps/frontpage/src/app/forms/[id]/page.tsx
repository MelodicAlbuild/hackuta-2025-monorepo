import { notFound } from 'next/navigation';

import VolunteerRegistrationForm from '../_components/volunteer-registration-form';
import WalkInRegistration from '../_components/walk-in-form';

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

  if (id === '277812') {
    return <WalkInRegistration />;
  }

  notFound();
}

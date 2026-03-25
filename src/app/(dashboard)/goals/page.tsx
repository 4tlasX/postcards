import { redirect } from 'next/navigation';
import { getAllPosts, getAllTaxonomies } from '@/lib/db';
import { getServerSession } from '@/app/auth/actions';
import { GoalsView } from '@/components/views';

export default async function GoalsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login');
  }

  const [posts, taxonomies] = await Promise.all([
    getAllPosts(session.schemaName),
    getAllTaxonomies(session.schemaName),
  ]);

  const goalTax = taxonomies.find((t) => t.name.toLowerCase() === 'goal');
  const milestoneTax = taxonomies.find((t) => t.name.toLowerCase() === 'milestone');

  const goals = goalTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === goalTax.id)
    : [];
  const milestones = milestoneTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === milestoneTax.id)
    : [];

  return (
    <GoalsView
      initialGoals={goals}
      initialMilestones={milestones}
      taxonomies={taxonomies}
    />
  );
}

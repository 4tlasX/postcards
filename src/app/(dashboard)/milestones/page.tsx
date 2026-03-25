import { redirect } from 'next/navigation';
import { getAllPosts, getAllTaxonomies } from '@/lib/db';
import { getServerSession } from '@/app/auth/actions';
import { MilestonesView } from '@/components/views';

export default async function MilestonesPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login');
  }

  const [posts, taxonomies] = await Promise.all([
    getAllPosts(session.schemaName),
    getAllTaxonomies(session.schemaName),
  ]);

  const milestoneTax = taxonomies.find((t) => t.name.toLowerCase() === 'milestone');
  const taskTax = taxonomies.find((t) => t.name.toLowerCase() === 'task');
  const goalTax = taxonomies.find((t) => t.name.toLowerCase() === 'goal');

  const milestones = milestoneTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === milestoneTax.id)
    : [];
  const tasks = taskTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === taskTax.id)
    : [];
  const goals = goalTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === goalTax.id)
    : [];

  return (
    <MilestonesView
      initialMilestones={milestones}
      initialTasks={tasks}
      initialGoals={goals}
      taxonomies={taxonomies}
    />
  );
}

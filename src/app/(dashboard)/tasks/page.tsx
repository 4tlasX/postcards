import { redirect } from 'next/navigation';
import { getAllPosts, getAllTaxonomies } from '@/lib/db';
import { getServerSession } from '@/app/auth/actions';
import { TasksView } from '@/components/views';

export default async function TasksPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login');
  }

  const [posts, taxonomies] = await Promise.all([
    getAllPosts(session.schemaName),
    getAllTaxonomies(session.schemaName),
  ]);

  const taskTax = taxonomies.find((t) => t.name.toLowerCase() === 'task');
  const milestoneTax = taxonomies.find((t) => t.name.toLowerCase() === 'milestone');

  const tasks = taskTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === taskTax.id)
    : [];
  const milestones = milestoneTax
    ? posts.filter((p) => (p.metadata?._taxonomyId as number | undefined) === milestoneTax.id)
    : [];

  return (
    <TasksView
      initialTasks={tasks}
      initialMilestones={milestones}
      taxonomies={taxonomies}
    />
  );
}
